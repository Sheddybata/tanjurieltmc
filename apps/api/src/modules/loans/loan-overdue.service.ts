import { Injectable } from '@nestjs/common';
import { LoanStatus } from '@tanjuriel/database';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class LoanOverdueService {
  constructor(private prisma: PrismaService) {}

  /** Marks overdue installments and notifies branch staff. Safe to call on dashboard load. */
  async syncOverdueLoans() {
    const now = new Date();
    const overdueSchedules = await this.prisma.loanSchedule.findMany({
      where: {
        isPaid: false,
        dueDate: { lt: now },
        loan: { status: { in: [LoanStatus.ACTIVE, LoanStatus.DISBURSED, LoanStatus.OVERDUE] } },
      },
      include: {
        loan: {
          select: {
            id: true,
            loanNumber: true,
            branchId: true,
            customer: { select: { firstName: true, lastName: true } },
          },
        },
      },
      take: 50,
    });

    const loanIds = [...new Set(overdueSchedules.map((s) => s.loanId))];
    if (loanIds.length === 0) return { updated: 0 };

    await this.prisma.loan.updateMany({
      where: { id: { in: loanIds }, status: { not: LoanStatus.OVERDUE } },
      data: { status: LoanStatus.OVERDUE },
    });

    for (const schedule of overdueSchedules) {
      const loan = schedule.loan;
      const staff = await this.prisma.user.findMany({
        where: {
          branchId: loan.branchId,
          role: { in: ['MANAGER', 'TELLER'] },
          status: 'ACTIVE',
        },
        select: { id: true },
        take: 10,
      });

      const memberName = `${loan.customer.firstName} ${loan.customer.lastName}`;
      const body = `Loan ${loan.loanNumber} (${memberName}) has a missed installment due ${schedule.dueDate.toISOString().slice(0, 10)}. Follow up required.`;

      for (const user of staff) {
        const existing = await this.prisma.notification.findFirst({
          where: {
            userId: user.id,
            entityType: 'LoanSchedule',
            entityId: schedule.id,
            type: 'LOAN_OVERDUE',
          },
        });
        if (existing) continue;

        await this.prisma.notification.create({
          data: {
            userId: user.id,
            title: 'Loan defaulter alert',
            body,
            type: 'LOAN_OVERDUE',
            entityType: 'LoanSchedule',
            entityId: schedule.id,
          },
        });
      }
    }

    return { updated: loanIds.length };
  }
}
