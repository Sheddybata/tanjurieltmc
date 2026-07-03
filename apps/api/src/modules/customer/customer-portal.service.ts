import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ApprovalAction, LoanStatus, PaymentChannel } from '@tanjuriel/database';
import { PrismaService } from '../../common/prisma/prisma.service';
import { OperationsService } from '../operations/operations.service';
import { CustomerAuthService } from '../customer-auth/customer-auth.service';
import {
  calculateLoanSchedule,
  generateLoanNumber,
  paginate,
  paginationMeta,
} from '../../common/utils/reference.util';
import { CustomerDepositRequestDto, CustomerTransferRequestDto } from '../operations/dto/operations.dto';
import { CustomerApplyLoanDto } from './dto/customer-loan.dto';
import { ensureCustomerKycVerified } from '../../common/utils/kyc.util';
import { validateCollateralInput } from '../../common/utils/customer-registration.util';

@Injectable()
export class CustomerPortalService {
  constructor(
    private prisma: PrismaService,
    private operationsService: OperationsService,
    private customerAuthService: CustomerAuthService,
  ) {}

  async getProfile(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        accounts: {
          where: { status: { in: ['ACTIVE', 'PENDING'] } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!customer) throw new NotFoundException('Customer not found');
    const { pinHash, ...safe } = customer;
    return safe;
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

  async applyForLoan(customerId: string, dto: CustomerApplyLoanDto, collateralPhotoUrl?: string) {
    await ensureCustomerKycVerified(this.prisma, customerId);
    const pinValid = await this.customerAuthService.verifyPin(customerId, dto.pin);
    if (!pinValid) throw new BadRequestException('Invalid PIN');

    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new NotFoundException('Customer not found');

    const product = await this.prisma.loanProduct.findUnique({ where: { id: dto.productId } });
    if (!product || !product.isActive) throw new NotFoundException('Loan product not found');

    validateCollateralInput(product.requiresCollateral, dto);
    if (product.requiresCollateral && !collateralPhotoUrl) {
      throw new BadRequestException('Collateral photo is required');
    }

    const amount = dto.principalAmount;
    if (amount < Number(product.minAmount) || amount > Number(product.maxAmount)) {
      throw new BadRequestException(
        `Amount must be between ${product.minAmount} and ${product.maxAmount}`,
      );
    }
    if (dto.tenureMonths < product.minTenureMonths || dto.tenureMonths > product.maxTenureMonths) {
      throw new BadRequestException(
        `Tenure must be between ${product.minTenureMonths} and ${product.maxTenureMonths} months`,
      );
    }

    const { monthlyPayment, totalRepayable, schedule } = calculateLoanSchedule(
      amount,
      Number(product.interestRate),
      dto.tenureMonths,
    );

    const loan = await this.prisma.$transaction(async (tx) => {
      const newLoan = await tx.loan.create({
        data: {
          loanNumber: generateLoanNumber(),
          status: LoanStatus.SUBMITTED,
          principalAmount: amount,
          interestRate: product.interestRate,
          tenureMonths: dto.tenureMonths,
          monthlyPayment,
          totalRepayable,
          outstandingBalance: totalRepayable,
          purpose: dto.purpose,
          collateral: dto.collateral,
          collateralType: dto.collateralType,
          collateralEstimatedValue: dto.collateralEstimatedValue,
          collateralPhotoUrl,
          guarantorName: dto.guarantorName,
          guarantorPhone: dto.guarantorPhone,
          customerId,
          productId: dto.productId,
          branchId: customer.branchId,
          submittedAt: new Date(),
        },
      });

      await tx.loanApproval.create({
        data: {
          loanId: newLoan.id,
          actorId: customer.registeredById,
          action: ApprovalAction.SUBMIT,
          comment: 'Application submitted via customer mobile app',
        },
      });

      await tx.loanSchedule.createMany({
        data: schedule.map((s) => ({ loanId: newLoan.id, ...s })),
      });

      return newLoan;
    });

    return this.getLoan(customerId, loan.id);
  }

  private async ensureAccountOwnership(customerId: string, accountId: string) {
    const account = await this.prisma.account.findUnique({ where: { id: accountId } });
    if (!account) throw new NotFoundException('Account not found');
    if (account.customerId !== customerId) {
      throw new ForbiddenException('Account does not belong to customer');
    }
  }
}
