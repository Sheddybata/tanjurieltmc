import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AccountOfficer, LoanStatus } from '@tanjuriel/database';
import { JwtPayload, UserRole } from '@tanjuriel/shared';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ACCOUNT_OFFICER_LABELS } from '../../common/constants/account-officers.constant';
import { paginate, paginationMeta } from '../../common/utils/reference.util';

const ACTIVE_LOAN_STATUSES: LoanStatus[] = [
  LoanStatus.DISBURSED,
  LoanStatus.ACTIVE,
  LoanStatus.OVERDUE,
];

@Injectable()
export class AccountOfficerPortalService {
  constructor(private prisma: PrismaService) {}

  private requireOfficerCode(user: JwtPayload): AccountOfficer {
    if (user.role !== UserRole.ACCOUNT_OFFICER || !user.accountOfficer) {
      throw new ForbiddenException('Account officer profile is not configured for this login');
    }
    return user.accountOfficer as AccountOfficer;
  }

  getProfile(user: JwtPayload) {
    const code = this.requireOfficerCode(user);
    return {
      accountOfficer: code,
      label: ACCOUNT_OFFICER_LABELS[code],
    };
  }

  async getSummary(user: JwtPayload) {
    const code = this.requireOfficerCode(user);
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const customerCount = await this.prisma.customer.count({
      where: { accountOfficer: code },
    });

    const scheduleWhere = {
      isPaid: false,
      loan: {
        status: { in: ACTIVE_LOAN_STATUSES },
        customer: { accountOfficer: code },
      },
    };

    const [overdueInstallments, dueThisWeek, activeLoans] = await Promise.all([
      this.prisma.loanSchedule.count({
        where: { ...scheduleWhere, dueDate: { lt: now } },
      }),
      this.prisma.loanSchedule.count({
        where: { ...scheduleWhere, dueDate: { gte: now, lte: weekEnd } },
      }),
      this.prisma.loan.count({
        where: {
          status: { in: ACTIVE_LOAN_STATUSES },
          customer: { accountOfficer: code },
        },
      }),
    ]);

    return {
      customerCount,
      activeLoans,
      overdueInstallments,
      dueThisWeekInstallments: dueThisWeek,
    };
  }

  async listCustomers(user: JwtPayload, query?: string, page = 1, limit = 50) {
    const code = this.requireOfficerCode(user);
    const { skip, take, page: p, limit: l } = paginate(page, limit, 200);

    const where = {
      accountOfficer: code,
      ...(query?.trim()
        ? {
            OR: [
              { firstName: { contains: query.trim(), mode: 'insensitive' as const } },
              { lastName: { contains: query.trim(), mode: 'insensitive' as const } },
              { phone: { contains: query.trim() } },
              { customerNumber: { contains: query.trim(), mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        select: {
          id: true,
          customerNumber: true,
          firstName: true,
          lastName: true,
          phone: true,
          accountOfficerAssignedAt: true,
          accounts: {
            where: { status: 'ACTIVE' },
            select: { id: true, accountNumber: true, type: true, balance: true },
          },
          loans: {
            where: { status: { in: ACTIVE_LOAN_STATUSES } },
            select: {
              id: true,
              loanNumber: true,
              status: true,
              outstandingBalance: true,
              schedules: {
                where: { isPaid: false },
                orderBy: { dueDate: 'asc' },
                take: 1,
                select: {
                  dueDate: true,
                  totalDue: true,
                  installmentNumber: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      data: customers.map((c) => ({
        ...c,
        nextLoanDue: c.loans
          .map((loan) => {
            const next = loan.schedules[0];
            if (!next) return null;
            return {
              loanId: loan.id,
              loanNumber: loan.loanNumber,
              dueDate: next.dueDate,
              totalDue: next.totalDue,
              installmentNumber: next.installmentNumber,
              isOverdue: next.dueDate < new Date(),
            };
          })
          .filter(Boolean)
          .sort((a, b) => a!.dueDate.getTime() - b!.dueDate.getTime())[0] ?? null,
        loans: c.loans.map(({ schedules, ...loan }) => loan),
      })),
      meta: paginationMeta(total, p, l),
    };
  }

  async getCustomer(user: JwtPayload, customerId: string) {
    const code = this.requireOfficerCode(user);
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, accountOfficer: code },
      select: {
        id: true,
        customerNumber: true,
        firstName: true,
        lastName: true,
        middleName: true,
        phone: true,
        alternatePhone: true,
        email: true,
        address: true,
        city: true,
        state: true,
        kycStatus: true,
        accountOfficerAssignedAt: true,
        accounts: {
          select: {
            id: true,
            accountNumber: true,
            type: true,
            status: true,
            balance: true,
          },
        },
        loans: {
          where: { status: { in: ACTIVE_LOAN_STATUSES } },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            loanNumber: true,
            status: true,
            principalAmount: true,
            outstandingBalance: true,
            monthlyPayment: true,
            disbursedAt: true,
            schedules: {
              orderBy: { installmentNumber: 'asc' },
              select: {
                installmentNumber: true,
                dueDate: true,
                totalDue: true,
                paidAmount: true,
                isPaid: true,
                paidAt: true,
              },
            },
          },
        },
      },
    });
    if (!customer) throw new NotFoundException('Customer not found in your portfolio');
    return customer;
  }

  async listLoanFollowUp(user: JwtPayload, filter: 'all' | 'overdue' | 'week' = 'all') {
    const code = this.requireOfficerCode(user);
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const dueDateFilter =
      filter === 'overdue'
        ? { lt: now }
        : filter === 'week'
          ? { gte: now, lte: weekEnd }
          : undefined;

    const rows = await this.prisma.loanSchedule.findMany({
      where: {
        isPaid: false,
        ...(dueDateFilter ? { dueDate: dueDateFilter } : {}),
        loan: {
          status: { in: ACTIVE_LOAN_STATUSES },
          customer: { accountOfficer: code },
        },
      },
      orderBy: { dueDate: 'asc' },
      take: 500,
      include: {
        loan: {
          select: {
            id: true,
            loanNumber: true,
            status: true,
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                customerNumber: true,
              },
            },
          },
        },
      },
    });

    return rows.map((row) => ({
      scheduleId: row.id,
      installmentNumber: row.installmentNumber,
      dueDate: row.dueDate,
      totalDue: row.totalDue,
      paidAmount: row.paidAmount,
      isOverdue: row.dueDate < now,
      loan: row.loan,
    }));
  }
}
