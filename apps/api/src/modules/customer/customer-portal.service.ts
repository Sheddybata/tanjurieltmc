import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import {
  PaymentChannel,
  AccountType,
  AccountStatus,
  NibssTransactionStatus,
  NibssTransactionType,
} from '@tanjuriel/database';
import { PrismaService } from '../../common/prisma/prisma.service';
import { OperationsService } from '../operations/operations.service';
import { CustomerAuthService } from '../customer-auth/customer-auth.service';
import { AlatService } from '../integrations/alat/alat.service';
import { LoanApplicationService } from '../loans/loan-application.service';
import {
  generateAccountNumber,
  generateTransactionRef,
  paginate,
  paginationMeta,
} from '../../common/utils/reference.util';
import { CustomerDepositRequestDto, CustomerTransferRequestDto, CustomerWithdrawalRequestDto } from '../operations/dto/operations.dto';
import { CustomerApplyLoanDto, CustomerLoanQuoteDto } from './dto/customer-loan.dto';
import { CustomerOpenAccountDto } from './dto/customer-open-account.dto';
import { NameEnquiryDto } from './dto/transfer.dto';
import { ensureCustomerKycVerified } from '../../common/utils/kyc.util';
import { customerAccountsInclude } from '../../common/utils/account-select.util';
import { memberPaymentRef, primaryMemberAccountNumber } from '../../common/utils/member-id.util';
import {
  assertChildSavingsOpenInput,
  childSavingsAccountData,
} from '../../common/utils/child-savings.util';

@Injectable()
export class CustomerPortalService {
  constructor(
    private prisma: PrismaService,
    private operationsService: OperationsService,
    private customerAuthService: CustomerAuthService,
    private alatService: AlatService,
    private loanApplicationService: LoanApplicationService,
  ) {}

  async getTransferBanks() {
    const { banks, source } = await this.alatService.getBanks();
    return {
      banks,
      source,
      nameEnquiryAvailable: this.alatService.isLiveConfigured(),
      alatStatus: this.alatService.getStatus(),
    };
  }

  async lookupTransferBeneficiary(dto: NameEnquiryDto) {
    const result = await this.alatService.nameEnquiry(dto.bankCode, dto.accountNumber);

    try {
      await this.prisma.nibssTransaction.create({
        data: {
          reference: generateTransactionRef(),
          sessionId: result.sessionId,
          type: NibssTransactionType.NAME_ENQUIRY,
          status:
            result.responseCode === '00'
              ? NibssTransactionStatus.SUCCESS
              : NibssTransactionStatus.FAILED,
          beneficiaryAccount: result.accountNumber,
          beneficiaryBank: result.bankCode,
          beneficiaryName: result.accountName || undefined,
          responseCode: result.responseCode,
          responseMessage: result.responseMessage,
          rawResponse: result as object,
        },
      });
    } catch {
      // audit log must not block name enquiry
    }

    if (result.responseCode !== '00' || !result.accountName) {
      throw new BadRequestException(
        result.responseMessage || 'Could not verify account name. Check bank and account number.',
      );
    }

    return {
      account_number: result.accountNumber,
      account_name: result.accountName,
      bank_code: result.bankCode,
      session_id: result.sessionId,
      response_code: result.responseCode,
    };
  }

  async getProfile(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: { accounts: customerAccountsInclude },
    });

    if (!customer) throw new NotFoundException('Customer not found');
    const { pinHash, customerNumber, paymentRef, ...safe } = customer;
    const memberId = primaryMemberAccountNumber(customer.accounts);
    return {
      ...safe,
      memberId,
      paymentRef: memberPaymentRef(customer.accounts, paymentRef),
    };
  }

  async openAccount(customerId: string, dto: CustomerOpenAccountDto, childPhotoUrl?: string) {
    await ensureCustomerKycVerified(this.prisma, customerId);

    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, branchId: true },
    });
    if (!customer?.branchId) {
      throw new BadRequestException('Your branch is not set. Visit a Tanjuriel branch to complete setup.');
    }

    if (dto.type === AccountType.MY_PIKIN) {
      assertChildSavingsOpenInput(dto, {
        photoRequired: true,
        hasPhoto: Boolean(childPhotoUrl),
      });
    }

    if (!dto.contributionFrequency) {
      throw new BadRequestException('Contribution frequency is required');
    }

    if (dto.type === AccountType.DAILY_SAVINGS) {
      const existingDaily = await this.prisma.account.findFirst({
        where: {
          customerId,
          type: AccountType.DAILY_SAVINGS,
          status: { in: [AccountStatus.ACTIVE, AccountStatus.PENDING] },
        },
      });
      if (existingDaily) {
        throw new ConflictException('You already have a Daily Savings account');
      }
    }

    const teller = await this.prisma.user.findUnique({
      where: { email: 'teller@tanjuriel.com' },
      select: { id: true },
    });
    if (!teller) throw new NotFoundException('Default teller not configured');

    const childFields =
      dto.type === AccountType.MY_PIKIN
        ? childSavingsAccountData(dto, childPhotoUrl)
        : {
            label: dto.label?.trim(),
            maturityDate: dto.maturityDate ? new Date(dto.maturityDate) : undefined,
            contributionFrequency: dto.contributionFrequency,
          };

    const account = await this.prisma.account.create({
      data: {
        accountNumber: generateAccountNumber(),
        type: dto.type,
        status: AccountStatus.ACTIVE,
        ...childFields,
        customerId,
        branchId: customer.branchId,
        openedById: teller.id,
        openedAt: new Date(),
      },
    });

    return account;
  }

  async getSettlementAccounts() {
    return this.prisma.settlementAccount.findMany({
      where: { isActive: true },
      orderBy: { provider: 'asc' },
    });
  }

  async createDepositRequest(customerId: string, dto: CustomerDepositRequestDto) {
    await ensureCustomerKycVerified(this.prisma, customerId);
    await this.ensureAccountOwnership(customerId, dto.accountId);

    return this.operationsService.createDepositRequest({
      accountId: dto.accountId,
      amount: dto.amount,
      channel: PaymentChannel.BANK_TRANSFER,
      settlementProvider: dto.settlementProvider,
      customerNote: dto.customerNote,
      customerId,
    });
  }

  async createTransferRequest(customerId: string, dto: CustomerTransferRequestDto) {
    await ensureCustomerKycVerified(this.prisma, customerId);
    await this.ensureAccountOwnership(customerId, dto.accountId);

    const account = await this.prisma.account.findUnique({
      where: { id: dto.accountId },
      select: { type: true },
    });
    if (account?.type === AccountType.MY_PIKIN) {
      throw new BadRequestException(
        'Child Savings accounts cannot be transferred from. After maturity, use Savings → Request withdrawal.',
      );
    }

    const pinValid = await this.customerAuthService.verifyPin(customerId, dto.pin);
    if (!pinValid) throw new BadRequestException('Invalid PIN');

    return this.operationsService.createTransferRequest({
      accountId: dto.accountId,
      amount: dto.amount,
      beneficiaryBank: dto.beneficiaryBank,
      beneficiaryAccount: dto.beneficiaryAccount,
      beneficiaryName: dto.beneficiaryName,
      narration: dto.narration,
      customerId,
    });
  }

  async createWithdrawalRequest(customerId: string, dto: CustomerWithdrawalRequestDto) {
    await ensureCustomerKycVerified(this.prisma, customerId);
    await this.ensureAccountOwnership(customerId, dto.accountId);

    const account = await this.prisma.account.findUnique({
      where: { id: dto.accountId },
      select: { type: true, maturityDate: true },
    });
    if (!account) throw new NotFoundException('Account not found');

    this.assertMyPikinMobileWithdrawalAllowed(account);

    const pinValid = await this.customerAuthService.verifyPin(customerId, dto.pin);
    if (!pinValid) throw new BadRequestException('Invalid PIN');

    return this.operationsService.createWithdrawalRequest({
      accountId: dto.accountId,
      amount: dto.amount,
      channel: PaymentChannel.CASH,
      narration: dto.narration || 'Child Savings withdrawal request — collect cash at branch after approval',
      customerId,
    });
  }

  private assertMyPikinMobileWithdrawalAllowed(account: { type: AccountType; maturityDate?: Date | null }) {
    if (account.type !== AccountType.MY_PIKIN) {
      throw new BadRequestException(
        'Mobile withdrawal requests are only available for Child Savings accounts after maturity.',
      );
    }
    if (!account.maturityDate) {
      throw new BadRequestException(
        'Child Savings maturity date is not set. Contact your branch.',
      );
    }
    if (account.maturityDate > new Date()) {
      throw new BadRequestException(
        `Child Savings account is locked until ${account.maturityDate.toISOString().slice(0, 10)}.`,
      );
    }
  }

  async listPaymentRequests(customerId: string, page = 1, limit = 20) {
    const { skip, take, page: p, limit: l } = paginate(page, limit);

    const [data, total] = await Promise.all([
      this.prisma.paymentRequest.findMany({
        where: { customerId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          account: { select: { accountNumber: true, type: true } },
        },
      }),
      this.prisma.paymentRequest.count({ where: { customerId } }),
    ]);

    return { data, meta: paginationMeta(total, p, l) };
  }

  async listTransactions(customerId: string, page = 1, limit = 20) {
    const { skip, take, page: p, limit: l } = paginate(page, limit);

    const accounts = await this.prisma.account.findMany({
      where: { customerId },
      select: { id: true },
    });

    const accountIds = accounts.map((a) => a.id);

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { accountId: { in: accountIds } },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.transaction.count({ where: { accountId: { in: accountIds } } }),
    ]);

    return { data, meta: paginationMeta(total, p, l) };
  }

  async listNotifications(customerId: string, page = 1, limit = 20) {
    const { skip, take, page: p, limit: l } = paginate(page, limit);

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { customerId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where: { customerId } }),
    ]);

    return { data, meta: paginationMeta(total, p, l) };
  }

  async markNotificationRead(customerId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, customerId },
    });

    if (!notification) throw new NotFoundException('Notification not found');

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async getUnreadNotificationCount(customerId: string) {
    const count = await this.prisma.notification.count({
      where: { customerId, isRead: false },
    });
    return { count };
  }

  getAppConfig() {
    return {
      transferFee: Number(process.env.TRANSFER_FEE ?? 25),
      pinLength: 4,
      currency: 'NGN',
      nameEnquiryAvailable: this.alatService.isLiveConfigured(),
      alatEnabled: this.alatService.isEnabled(),
      alatStatus: this.alatService.getStatus(),
    };
  }

  async listLoanProducts() {
    return this.prisma.loanProduct.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async listLoans(customerId: string, page = 1, limit = 20) {
    const { skip, take, page: p, limit: l } = paginate(page, limit);

    const [data, total] = await Promise.all([
      this.prisma.loan.findMany({
        where: { customerId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { name: true, code: true } },
        },
      }),
      this.prisma.loan.count({ where: { customerId } }),
    ]);

    return { data, meta: paginationMeta(total, p, l) };
  }

  async getLoan(customerId: string, loanId: string) {
    const loan = await this.prisma.loan.findFirst({
      where: { id: loanId, customerId },
      include: {
        product: true,
        schedules: { orderBy: { installmentNumber: 'asc' } },
      },
    });

    if (!loan) throw new NotFoundException('Loan not found');
    return loan;
  }

  async quoteLoan(dto: CustomerLoanQuoteDto) {
    return this.loanApplicationService.quoteLoan(dto);
  }

  async applyForLoan(customerId: string, dto: CustomerApplyLoanDto, collateralPhotoUrl?: string) {
    await ensureCustomerKycVerified(this.prisma, customerId);
    const pinValid = await this.customerAuthService.verifyPin(customerId, dto.pin);
    if (!pinValid) throw new BadRequestException('Invalid PIN');

    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new NotFoundException('Customer not found');

    const { pin: _pin, ...applicationDto } = dto;
    const loan = await this.loanApplicationService.createApplication({
      customerId,
      dto: applicationDto,
      collateralPhotoUrl,
      actorId: customer.registeredById,
      source: 'MOBILE',
    });

    return this.getLoan(customerId, loan.id);
  }

  private async ensureAccountOwnership(customerId: string, accountId: string) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { id: true, customerId: true },
    });
    if (!account) throw new NotFoundException('Account not found');
    if (account.customerId !== customerId) {
      throw new ForbiddenException('Account does not belong to customer');
    }
  }
}
