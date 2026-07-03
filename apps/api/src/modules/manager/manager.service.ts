import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApprovalAction, LoanStatus, TransactionStatus, TransactionType } from '@tanjuriel/database';
import { JwtPayload, PortfolioSummary } from '@tanjuriel/shared';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  generateLoanNumber,
  generateTransactionRef,
  calculateLoanSchedule,
  paginate,
  paginationMeta,
} from '../../common/utils/reference.util';
import { CreateLoanDto, LoanActionDto } from './dto/manager.dto';

@Injectable()
export class ManagerService {
  constructor(private prisma: PrismaService) {}

  async createLoanApplication(dto: CreateLoanDto, user: JwtPayload) {
    const [customer, product] = await Promise.all([
      this.prisma.customer.findUnique({ where: { id: dto.customerId } }),
      this.prisma.loanProduct.findUnique({ where: { id: dto.productId } }),
    ]);

    if (!customer) throw new NotFoundException('Customer not found');
    if (!product || !product.isActive) throw new NotFoundException('Loan product not found');

    const amount = dto.principalAmount;
    if (amount < Number(product.minAmount) || amount > Number(product.maxAmount)) {
      throw new BadRequestException(`Amount must be between ${product.minAmount} and ${product.maxAmount}`);
    }
    if (dto.tenureMonths < product.minTenureMonths || dto.tenureMonths > product.maxTenureMonths) {
      throw new BadRequestException(`Tenure must be between ${product.minTenureMonths} and ${product.maxTenureMonths} months`);
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
          customerId: dto.customerId,
          productId: dto.productId,
          branchId: customer.branchId,
          submittedAt: new Date(),
        },
      });

      await tx.loanApproval.create({
        data: { loanId: newLoan.id, actorId: user.sub, action: ApprovalAction.SUBMIT, comment: 'Application submitted' },
      });

      await tx.loanSchedule.createMany({
        data: schedule.map((s) => ({ loanId: newLoan.id, ...s })),
      });

      return newLoan;
    });

    return this.getLoan(loan.id);
  }

  async getLoans(status?: LoanStatus, page = 1, limit = 20) {
    const { skip, take, page: p, limit: l } = paginate(page, limit);
    const where = status ? { status } : {};

    const [loans, total] = await Promise.all([
      this.prisma.loan.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { firstName: true, lastName: true, customerNumber: true, phone: true } },
          product: { select: { name: true, code: true } },
          approvals: {
            include: { actor: { select: { firstName: true, lastName: true, role: true } } },
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      this.prisma.loan.count({ where }),
    ]);

    return { data: loans, meta: paginationMeta(total, p, l) };
  }

  async getLoan(id: string) {
    const loan = await this.prisma.loan.findUnique({
      where: { id },
      include: {
        customer: true,
        product: true,
        schedules: { orderBy: { installmentNumber: 'asc' } },
        approvals: {
          include: { actor: { select: { firstName: true, lastName: true, role: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!loan) throw new NotFoundException('Loan not found');
    return loan;
  }

  async reviewLoan(id: string, user: JwtPayload, dto: LoanActionDto) {
    const loan = await this.getLoan(id);
    if (loan.status !== LoanStatus.SUBMITTED) {
      throw new BadRequestException('Loan is not in submitted status');
    }

    await this.prisma.$transaction([
      this.prisma.loan.update({ where: { id }, data: { status: LoanStatus.UNDER_REVIEW } }),
      this.prisma.loanApproval.create({
        data: { loanId: id, actorId: user.sub, action: ApprovalAction.REVIEW, comment: dto.comment },
      }),
    ]);

    return this.getLoan(id);
  }

  async approveLoan(id: string, user: JwtPayload, dto: LoanActionDto) {
    const loan = await this.getLoan(id);
    if (![LoanStatus.SUBMITTED, LoanStatus.UNDER_REVIEW].includes(loan.status as 'SUBMITTED' | 'UNDER_REVIEW')) {
      throw new BadRequestException('Loan cannot be approved in current status');
    }

    if (loan.product.requiresCollateral && !loan.collateralVerifiedAt) {
      throw new BadRequestException('Verify collateral before approving this loan');
    }

    await this.prisma.$transaction([
      this.prisma.loan.update({ where: { id }, data: { status: LoanStatus.APPROVED, approvedAt: new Date() } }),
      this.prisma.loanApproval.create({
        data: { loanId: id, actorId: user.sub, action: ApprovalAction.APPROVE, comment: dto.comment },
      }),
    ]);

    return this.getLoan(id);
  }

  async verifyCollateral(id: string, user: JwtPayload, dto: LoanActionDto) {
    const loan = await this.getLoan(id);
    if (!loan.product.requiresCollateral) {
      throw new BadRequestException('This loan product does not require collateral verification');
    }
    if (!loan.collateral && !loan.collateralPhotoUrl) {
      throw new BadRequestException('No collateral submitted on this application');
    }

    await this.prisma.loan.update({
      where: { id },
      data: {
        collateralVerifiedAt: new Date(),
        collateralVerifiedById: user.sub,
        collateralVerificationNote: dto.comment ?? 'Collateral verified by manager',
      },
    });

    return this.getLoan(id);
  }

  async rejectLoan(id: string, user: JwtPayload, dto: LoanActionDto) {
    const loan = await this.getLoan(id);
    if ([LoanStatus.DISBURSED, LoanStatus.CLOSED, LoanStatus.REJECTED].includes(loan.status as never)) {
      throw new BadRequestException('Loan cannot be rejected in current status');
    }

    await this.prisma.$transaction([
      this.prisma.loan.update({ where: { id }, data: { status: LoanStatus.REJECTED } }),
      this.prisma.loanApproval.create({
        data: { loanId: id, actorId: user.sub, action: ApprovalAction.REJECT, comment: dto.comment },
      }),
    ]);

    return this.getLoan(id);
  }

  async disburseLoan(id: string, user: JwtPayload, dto: LoanActionDto) {
    const loan = await this.getLoan(id);
    if (loan.status !== LoanStatus.APPROVED) {
      throw new BadRequestException('Loan must be approved before disbursement');
    }

    const savingsAccount = await this.prisma.account.findFirst({
      where: { customerId: loan.customerId, type: 'SAVINGS', status: 'ACTIVE' },
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.loan.update({
        where: { id },
        data: {
          status: LoanStatus.DISBURSED,
          disbursedAmount: loan.principalAmount,
          disbursedAt: new Date(),
          accountId: savingsAccount?.id,
        },
      });

      await tx.loanApproval.create({
        data: { loanId: id, actorId: user.sub, action: ApprovalAction.DISBURSE, comment: dto.comment },
      });

      if (savingsAccount) {
        const balanceBefore = Number(savingsAccount.balance);
        const amount = Number(loan.principalAmount);
        const balanceAfter = balanceBefore + amount;

        await tx.account.update({
          where: { id: savingsAccount.id },
          data: { balance: balanceAfter, availableBalance: balanceAfter },
        });

        await tx.transaction.create({
          data: {
            reference: generateTransactionRef(),
            type: TransactionType.LOAN_DISBURSEMENT,
            status: TransactionStatus.COMPLETED,
            amount,
            balanceBefore,
            balanceAfter,
            narration: `Loan disbursement - ${loan.loanNumber}`,
            accountId: savingsAccount.id,
            processedById: user.sub,
          },
        });
      }
    });

    return this.getLoan(id);
  }

  async getPortfolioSummary(): Promise<PortfolioSummary> {
    const [loans, overdueCount] = await Promise.all([
      this.prisma.loan.findMany({
        where: { status: { in: [LoanStatus.DISBURSED, LoanStatus.ACTIVE, LoanStatus.OVERDUE] } },
      }),
      this.prisma.loanSchedule.count({
        where: { isPaid: false, dueDate: { lt: new Date() } },
      }),
    ]);

    const totalOutstanding = loans.reduce((s, l) => s + Number(l.outstandingBalance), 0);
    const totalDisbursed = loans.reduce((s, l) => s + Number(l.disbursedAmount), 0);
    const activeLoans = loans.length;

    const statusCounts = await this.prisma.loan.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const loansByStatus = Object.fromEntries(statusCounts.map((s) => [s.status, s._count.id]));

    return {
      totalOutstanding,
      totalDisbursed,
      par30: activeLoans > 0 ? overdueCount / activeLoans : 0,
      par60: 0,
      par90: 0,
      collectionRate: totalDisbursed > 0 ? (totalDisbursed - totalOutstanding) / totalDisbursed : 0,
      averageLoanSize: activeLoans > 0 ? totalOutstanding / activeLoans : 0,
      loansByStatus,
    };
  }

  async getLoanProducts() {
    return this.prisma.loanProduct.findMany({ where: { isActive: true } });
  }
}
