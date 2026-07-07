import { Injectable } from '@nestjs/common';
import { TransactionType, LoanStatus, PaymentRequestStatus, PaymentRequestType } from '@tanjuriel/database';
import { DashboardMetrics } from '@tanjuriel/shared';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CacheService } from '../../common/cache/cache.service';

const DASHBOARD_CACHE_KEY = 'reporting:dashboard:v1';
const DASHBOARD_CACHE_TTL_SECONDS = 30;

@Injectable()
export class ReportingService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    return this.cache.wrap(DASHBOARD_CACHE_KEY, DASHBOARD_CACHE_TTL_SECONDS, () =>
      this.computeDashboardMetrics(),
    );
  }

  private async computeDashboardMetrics(): Promise<DashboardMetrics> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalCustomers,
      activeAccounts,
      depositsToday,
      withdrawalsToday,
      activeLoans,
      overdueLoans,
      pendingLoanApprovals,
      pendingDeposits,
      pendingTransfers,
      pendingWithdrawals,
      balanceAgg,
      portfolioAgg,
    ] = await Promise.all([
      this.prisma.customer.count(),
      this.prisma.account.count({ where: { status: 'ACTIVE' } }),
      this.prisma.transaction.aggregate({
        where: { type: TransactionType.DEPOSIT, createdAt: { gte: today }, status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { type: TransactionType.WITHDRAWAL, createdAt: { gte: today }, status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      this.prisma.loan.count({ where: { status: { in: [LoanStatus.DISBURSED, LoanStatus.ACTIVE] } } }),
      this.prisma.loan.count({ where: { status: LoanStatus.OVERDUE } }),
      this.prisma.loan.count({ where: { status: { in: [LoanStatus.SUBMITTED, LoanStatus.UNDER_REVIEW] } } }),
      this.prisma.paymentRequest.count({
        where: { type: PaymentRequestType.DEPOSIT, status: PaymentRequestStatus.PENDING },
      }),
      this.prisma.paymentRequest.count({
        where: { type: PaymentRequestType.TRANSFER, status: PaymentRequestStatus.PENDING },
      }),
      this.prisma.paymentRequest.count({
        where: { type: PaymentRequestType.WITHDRAWAL, status: PaymentRequestStatus.PENDING },
      }),
      this.prisma.account.aggregate({
        where: { status: 'ACTIVE' },
        _sum: { balance: true },
      }),
      this.prisma.loan.aggregate({
        where: { status: { in: [LoanStatus.DISBURSED, LoanStatus.ACTIVE, LoanStatus.OVERDUE] } },
        _sum: { outstandingBalance: true },
      }),
    ]);

    const overdueSchedules = await this.prisma.loanSchedule.count({
      where: { isPaid: false, dueDate: { lt: new Date() } },
    });

    return {
      totalCustomers,
      activeAccounts,
      totalDepositsToday: Number(depositsToday._sum.amount || 0),
      totalWithdrawalsToday: Number(withdrawalsToday._sum.amount || 0),
      activeLoans,
      overdueLoans,
      portfolioAtRisk: activeLoans > 0 ? overdueSchedules / activeLoans : 0,
      totalPortfolio: Number(portfolioAgg._sum.outstandingBalance || 0),
      pendingApprovals: pendingLoanApprovals,
      pendingDeposits,
      pendingTransfers,
      pendingWithdrawals,
      totalCustomerBalances: Number(balanceAgg._sum.balance || 0),
    };
  }

  async getTransactionReport(startDate: string, endDate: string) {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        createdAt: { gte: new Date(startDate), lte: new Date(endDate) },
        status: 'COMPLETED',
      },
      include: {
        account: { select: { accountNumber: true, customer: { select: { firstName: true, lastName: true } } } },
        processedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const summary = await this.prisma.transaction.groupBy({
      by: ['type'],
      where: {
        createdAt: { gte: new Date(startDate), lte: new Date(endDate) },
        status: 'COMPLETED',
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    return { transactions, summary };
  }

  async getDailyTrends(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const transactions = await this.prisma.transaction.findMany({
      where: { createdAt: { gte: startDate }, status: 'COMPLETED' },
      select: { type: true, amount: true, createdAt: true },
    });

    const dailyMap = new Map<string, { deposits: number; withdrawals: number; date: string }>();

    for (const tx of transactions) {
      const dateKey = tx.createdAt.toISOString().split('T')[0];
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, { date: dateKey, deposits: 0, withdrawals: 0 });
      }
      const entry = dailyMap.get(dateKey)!;
      if (tx.type === TransactionType.DEPOSIT) entry.deposits += Number(tx.amount);
      if (tx.type === TransactionType.WITHDRAWAL) entry.withdrawals += Number(tx.amount);
    }

    return Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Persists an end-of-day summary into the DailySnapshot table so reports can
   * read a single pre-computed row instead of scanning the transactions table.
   * Safe to re-run for the same day — it upserts on the unique date.
   */
  async createDailySnapshot(date = new Date()) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const dayRange = { gte: start, lt: end };

    const [deposits, withdrawals, disbursed, repayments, activeAccounts, activeLoans, overdueLoans, overdueSchedules] =
      await Promise.all([
        this.prisma.transaction.aggregate({
          where: { type: TransactionType.DEPOSIT, status: 'COMPLETED', createdAt: dayRange },
          _sum: { amount: true },
        }),
        this.prisma.transaction.aggregate({
          where: { type: TransactionType.WITHDRAWAL, status: 'COMPLETED', createdAt: dayRange },
          _sum: { amount: true },
        }),
        this.prisma.transaction.aggregate({
          where: { type: TransactionType.LOAN_DISBURSEMENT, status: 'COMPLETED', createdAt: dayRange },
          _sum: { amount: true },
        }),
        this.prisma.transaction.aggregate({
          where: { type: TransactionType.LOAN_REPAYMENT, status: 'COMPLETED', createdAt: dayRange },
          _sum: { amount: true },
        }),
        this.prisma.account.count({ where: { status: 'ACTIVE' } }),
        this.prisma.loan.count({ where: { status: { in: [LoanStatus.DISBURSED, LoanStatus.ACTIVE] } } }),
        this.prisma.loan.count({ where: { status: LoanStatus.OVERDUE } }),
        this.prisma.loanSchedule.count({ where: { isPaid: false, dueDate: { lt: new Date() } } }),
      ]);

    // portfolioAtRisk is stored as Decimal(5,4); clamp so an unusually high ratio can never overflow the column.
    const portfolioAtRisk = activeLoans > 0 ? Math.min(overdueSchedules / activeLoans, 9.9999) : 0;

    const values = {
      totalDeposits: deposits._sum.amount ?? 0,
      totalWithdrawals: withdrawals._sum.amount ?? 0,
      totalLoansDisbursed: disbursed._sum.amount ?? 0,
      totalLoanRepayments: repayments._sum.amount ?? 0,
      activeAccounts,
      activeLoans,
      overdueLoans,
      portfolioAtRisk,
    };

    await this.prisma.dailySnapshot.upsert({
      where: { date: start },
      create: { date: start, ...values },
      update: values,
    });

    return { date: start, ...values };
  }
}
