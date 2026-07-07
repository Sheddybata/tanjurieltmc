import {

  Injectable,

  NotFoundException,

  BadRequestException,

  ConflictException,

  ForbiddenException,

} from '@nestjs/common';

import { AccountStatus, AccountType, CustomerKycStatus, LoanStatus, PaymentChannel, RegistrationSource } from '@tanjuriel/database';

import { JwtPayload, Permission } from '@tanjuriel/shared';

import { PrismaService } from '../../common/prisma/prisma.service';

import {

  generateAccountNumber,

  generateCustomerNumber,

  generatePaymentRef,

  paginate,

  paginationMeta,

} from '../../common/utils/reference.util';

import { RegisterCustomerDto, OpenAccountDto, TransactionDto, EnableMobileAccessDto, LoanRepaymentDto, TellerTransferDto } from './dto/teller.dto';

import { OperationsService } from '../operations/operations.service';
import { customerAccountSelect } from '../../common/utils/account-select.util';
import {
  assertChildSavingsOpenInput,
  childSavingsAccountData,
} from '../../common/utils/child-savings.util';
import {
  customerProfileCreateData,
  normalizePhone,
} from '../../common/utils/customer-profile.util';

import * as bcrypt from 'bcryptjs';



@Injectable()

export class TellerService {

  constructor(

    private prisma: PrismaService,

    private operationsService: OperationsService,

  ) {}



  async registerCustomer(dto: RegisterCustomerDto, user: JwtPayload, photoUrl?: string) {
    if (!user.branchId) throw new ForbiddenException('User must be assigned to a branch');
    if (!photoUrl) throw new BadRequestException('Customer photo is required');

    const phone = normalizePhone(dto.phone);
    const alternatePhone = dto.alternatePhone ? normalizePhone(dto.alternatePhone) : undefined;

    const existing = await this.prisma.customer.findFirst({
      where: {
        OR: [
          { phone },
          ...(dto.bvn ? [{ bvn: dto.bvn }] : []),
          ...(dto.nin ? [{ nin: dto.nin }] : []),
        ],
      },
    });
    if (existing) {
      throw new ConflictException('Phone, BVN, or NIN is already registered');
    }

    const customerNumber = generateCustomerNumber();
    const pinHash = dto.pin ? await bcrypt.hash(dto.pin, 12) : undefined;

    const customer = await this.prisma.customer.create({
      data: {
        customerNumber,
        paymentRef: generatePaymentRef(customerNumber),
        ...customerProfileCreateData({ ...dto, phone, alternatePhone }, photoUrl),
        pinHash,
        appEnabled: Boolean(pinHash),
        kycStatus: CustomerKycStatus.PENDING,
        branchId: user.branchId,
        registeredById: user.sub,
        registrationSource: RegistrationSource.BRANCH,
      },
      include: { branch: true, registeredBy: { select: { firstName: true, lastName: true } } },
    });

    return customer;
  }



  async searchCustomers(query: string, page = 1, limit = 20) {

    const { skip, take, page: p, limit: l } = paginate(page, limit);



    const where = query

      ? {

          OR: [

            { firstName: { contains: query, mode: 'insensitive' as const } },

            { lastName: { contains: query, mode: 'insensitive' as const } },

            { customerNumber: { contains: query, mode: 'insensitive' as const } },

            { phone: { contains: query } },

            { paymentRef: { contains: query, mode: 'insensitive' as const } },

            { bvn: { contains: query } },

            { accounts: { some: { accountNumber: { contains: query, mode: 'insensitive' as const } } } },

          ],

        }

      : {};



    const [customers, total] = await Promise.all([

      this.prisma.customer.findMany({

        where,

        skip,

        take,

        orderBy: { createdAt: 'desc' },

        include: { accounts: { select: { id: true, accountNumber: true, type: true, status: true, balance: true } } },

      }),

      this.prisma.customer.count({ where }),

    ]);



    return { data: customers, meta: paginationMeta(total, p, l) };

  }



  async getCustomer(id: string) {

    const customer = await this.prisma.customer.findUnique({

      where: { id },

      include: {

        accounts: { select: customerAccountSelect },

        loans: { select: { id: true, loanNumber: true, status: true, outstandingBalance: true } },

        branch: true,

      },

    });

    if (!customer) throw new NotFoundException('Customer not found');

    const pendingRequests = await this.prisma.paymentRequest.findMany({
      where: { customerId: id, status: 'PENDING' },
      include: {
        account: { select: { id: true, accountNumber: true, type: true, label: true } },
        initiatedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { ...customer, pendingRequests };
  }



  async openAccount(dto: OpenAccountDto, user: JwtPayload, childPhotoUrl?: string) {

    if (!user.branchId) throw new ForbiddenException('User must be assigned to a branch');

    const customer = await this.prisma.customer.findUnique({ where: { id: dto.customerId } });

    if (!customer) throw new NotFoundException('Customer not found');

    if (dto.type === AccountType.MY_PIKIN) {
      assertChildSavingsOpenInput(dto, {
        photoRequired: true,
        hasPhoto: Boolean(childPhotoUrl),
      });
    }

    if (dto.appPin) {

      const pinHash = await bcrypt.hash(dto.appPin, 12);

      await this.prisma.customer.update({

        where: { id: dto.customerId },

        data: { pinHash, appEnabled: true },

      });

    }



    const account = await this.prisma.$transaction(async (tx) => {

      const childFields =
        dto.type === AccountType.MY_PIKIN
          ? childSavingsAccountData(dto, childPhotoUrl)
          : {
              label: dto.label,
              maturityDate: dto.maturityDate ? new Date(dto.maturityDate) : undefined,
              contributionFrequency: dto.contributionFrequency,
            };

      const newAccount = await tx.account.create({

        data: {

          accountNumber: generateAccountNumber(),

          type: dto.type,
          status: AccountStatus.ACTIVE,
          ...childFields,
          customerId: dto.customerId,

          branchId: user.branchId!,

          openedById: user.sub,

          openedAt: new Date(),

        },

      });



      const priorCount = await tx.account.count({
        where: { customerId: dto.customerId, id: { not: newAccount.id } },
      });
      if (dto.type === AccountType.SAVINGS || priorCount === 0) {
        await tx.customer.update({
          where: { id: dto.customerId },
          data: { paymentRef: generatePaymentRef(newAccount.accountNumber) },
        });
      }

      if (dto.initialDeposit && dto.initialDeposit > 0) {

        await this.operationsService.createDepositRequest({

          accountId: newAccount.id,

          amount: dto.initialDeposit,

          channel: PaymentChannel.CASH,

          narration: 'Initial deposit on account opening',

          initiatedByStaffId: user.sub,

          customerId: dto.customerId,

        });

      }



      return tx.account.findUnique({

        where: { id: newAccount.id },

        include: { customer: true },

      });

    });



    return account;

  }



  async processDeposit(dto: TransactionDto, user: JwtPayload) {

    const request = await this.operationsService.createDepositRequest({

      accountId: dto.accountId,

      amount: dto.amount,

      channel: PaymentChannel.CASH,

      narration: dto.narration || 'Cash deposit',

      initiatedByStaffId: user.sub,

    });



    return { paymentRequest: request, message: 'Deposit submitted for manager approval' };

  }



  async processWithdrawal(dto: TransactionDto, user: JwtPayload) {
    const request = await this.operationsService.createWithdrawalRequest({

      accountId: dto.accountId,

      amount: dto.amount,

      channel: PaymentChannel.CASH,

      narration: dto.narration || 'Cash withdrawal',

      initiatedByStaffId: user.sub,

    });



    return { paymentRequest: request, message: 'Withdrawal submitted for manager approval' };

  }

  async processTransfer(dto: TellerTransferDto, user: JwtPayload) {
    const account = await this.prisma.account.findUnique({ where: { id: dto.accountId } });
    if (!account) throw new NotFoundException('Account not found');
    if (account.type === AccountType.MY_PIKIN) {
      throw new BadRequestException('Transfers are not allowed from Child Savings accounts');
    }

    const request = await this.operationsService.createTransferRequest({
      accountId: dto.accountId,
      amount: dto.amount,
      beneficiaryBank: dto.beneficiaryBank,
      beneficiaryAccount: dto.beneficiaryAccount,
      beneficiaryName: dto.beneficiaryName,
      narration: dto.narration || 'Branch transfer (teller)',
      customerId: account.customerId,
      initiatedByStaffId: user.sub,
    });

    return { paymentRequest: request, message: 'Transfer submitted for manager approval' };
  }

  async enableMobileAccess(customerId: string, dto: EnableMobileAccessDto) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new NotFoundException('Customer not found');

    const pinHash = await bcrypt.hash(dto.appPin, 12);
    return this.prisma.customer.update({
      where: { id: customerId },
      data: { pinHash, appEnabled: true },
    });
  }

  async processLoanRepayment(dto: LoanRepaymentDto, user: JwtPayload) {
    const loan = await this.prisma.loan.findUnique({ where: { id: dto.loanId } });
    if (!loan) throw new NotFoundException('Loan not found');
    if (!([LoanStatus.DISBURSED, LoanStatus.ACTIVE, LoanStatus.OVERDUE] as LoanStatus[]).includes(loan.status)) {
      throw new BadRequestException('Loan is not active for repayment');
    }
    if (dto.amount > Number(loan.outstandingBalance)) {
      throw new BadRequestException('Repayment amount exceeds outstanding balance');
    }

    const savingsAccount =
      (await this.prisma.account.findFirst({
        where: { customerId: loan.customerId, type: AccountType.SAVINGS, status: AccountStatus.ACTIVE },
      })) ??
      (await this.prisma.account.findFirst({
        where: { customerId: loan.customerId, status: AccountStatus.ACTIVE },
      }));

    if (!savingsAccount) {
      throw new BadRequestException('Customer has no active account to record repayment against');
    }

    const request = await this.operationsService.createLoanRepaymentRequest({
      loanId: dto.loanId,
      accountId: savingsAccount.id,
      amount: dto.amount,
      customerId: loan.customerId,
      initiatedByStaffId: user.sub,
      narration: dto.narration || `Cash loan repayment - ${loan.loanNumber}`,
    });

    return { paymentRequest: request, message: 'Loan repayment submitted for manager approval' };
  }



  async getTransactions(accountId: string, page = 1, limit = 20) {

    const { skip, take, page: p, limit: l } = paginate(page, limit);



    const [transactions, total] = await Promise.all([

      this.prisma.transaction.findMany({

        where: { accountId },

        skip,

        take,

        orderBy: { createdAt: 'desc' },

        include: { processedBy: { select: { firstName: true, lastName: true } } },

      }),

      this.prisma.transaction.count({ where: { accountId } }),

    ]);



    return { data: transactions, meta: paginationMeta(total, p, l) };
  }

  async listPendingKyc(page = 1, limit = 20) {
    const { skip, take, page: p, limit: l } = paginate(page, limit);
    const where = { kycStatus: CustomerKycStatus.PENDING };

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          branch: { select: { name: true, code: true } },
          accounts: { select: { accountNumber: true, status: true } },
        },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return { data, meta: paginationMeta(total, p, l) };
  }

  async verifyCustomerKyc(id: string, user: JwtPayload) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('Customer not found');
    if (customer.kycStatus !== CustomerKycStatus.PENDING) {
      throw new BadRequestException('Customer is not pending KYC verification');
    }

    return this.prisma.customer.update({
      where: { id },
      data: { kycStatus: CustomerKycStatus.VERIFIED, kycVerifiedAt: new Date() },
    });
  }

  async rejectCustomerKyc(id: string, reason?: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('Customer not found');
    if (customer.kycStatus !== CustomerKycStatus.PENDING) {
      throw new BadRequestException('Customer is not pending KYC verification');
    }

    return this.prisma.customer.update({
      where: { id },
      data: { kycStatus: CustomerKycStatus.REJECTED },
    });
  }
}


