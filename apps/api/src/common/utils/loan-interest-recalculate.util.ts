import { LoanRepaymentPlan, LoanStatus, Prisma } from '@tanjuriel/database';
import { PrismaService } from '../prisma/prisma.service';
import { calculateTanjuielLoanQuote, LOAN_FLAT_INTEREST_RATE } from './loan-pricing.util';

/** Loans that can be repriced without touching repayments or disbursement. */
export const REPRICEABLE_LOAN_STATUSES: LoanStatus[] = [
  LoanStatus.SUBMITTED,
  LoanStatus.UNDER_REVIEW,
  LoanStatus.APPROVED,
];

const EXCLUDED_BULK_STATUSES: LoanStatus[] = [
  LoanStatus.REJECTED,
  LoanStatus.CLOSED,
  LoanStatus.WRITTEN_OFF,
];

export function repriceableLoansWhere(): Prisma.LoanWhereInput {
  return {
    status: { in: REPRICEABLE_LOAN_STATUSES },
    tenurePeriods: { not: null },
    repaymentPlan: { not: null },
    schedules: { every: { isPaid: false, paidAmount: { equals: 0 } } },
  };
}

export function allLoansForBulkRepriceWhere(): Prisma.LoanWhereInput {
  return {
    status: { notIn: EXCLUDED_BULK_STATUSES },
    tenurePeriods: { not: null },
    repaymentPlan: { not: null },
  };
}

export function loanUsedLegacyFlatInterest(
  principal: number,
  flatInterest: number | null | undefined,
  targetRate = LOAN_FLAT_INTEREST_RATE,
): boolean {
  if (flatInterest == null) return true;
  const expected = Math.round(principal * targetRate * 100) / 100;
  return Math.abs(flatInterest - expected) >= 0.02;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function recalculateLoanWithFlatRate(
  tx: Prisma.TransactionClient,
  loanId: string,
  flatInterestRate: number,
) {
  const loan = await tx.loan.findUnique({
    where: { id: loanId },
    include: { schedules: { orderBy: { installmentNumber: 'asc' } } },
  });
  if (!loan) throw new Error('Loan not found');
  if (!loan.tenurePeriods || !loan.repaymentPlan) {
    throw new Error('Loan is missing tenure or repayment plan');
  }

  const quote = calculateTanjuielLoanQuote({
    principalAmount: Number(loan.principalAmount),
    tenurePeriods: loan.tenurePeriods,
    repaymentPlan: loan.repaymentPlan as LoanRepaymentPlan,
    flatInterestRate,
  });

  const paidTotal = loan.schedules.reduce((s, r) => s + Number(r.paidAmount), 0);
  const paidCount = loan.schedules.filter(
    (s) => s.isPaid || Number(s.paidAmount) > 0,
  ).length;
  const newOutstanding = roundMoney(Math.max(0, quote.totalRepayable - paidTotal));

  if (paidCount === 0) {
    await tx.loanSchedule.deleteMany({ where: { loanId: loan.id } });
    await tx.loanSchedule.createMany({
      data: quote.schedule.map((s) => ({
        loanId: loan.id,
        installmentNumber: s.installmentNumber,
        dueDate: s.dueDate,
        principalDue: s.principalDue,
        interestDue: s.interestDue,
        totalDue: s.totalDue,
      })),
    });
  } else {
    await tx.loanSchedule.deleteMany({
      where: {
        loanId: loan.id,
        isPaid: false,
        paidAmount: { equals: 0 },
      },
    });
    const remaining = quote.schedule.filter((s) => s.installmentNumber > paidCount);
    if (remaining.length > 0) {
      await tx.loanSchedule.createMany({
        data: remaining.map((s) => ({
          loanId: loan.id,
          installmentNumber: s.installmentNumber,
          dueDate: s.dueDate,
          principalDue: s.principalDue,
          interestDue: s.interestDue,
          totalDue: s.totalDue,
        })),
      });
    }
  }

  await tx.loan.update({
    where: { id: loan.id },
    data: {
      flatInterestAmount: quote.flatInterestAmount,
      totalRepayable: quote.totalRepayable,
      monthlyPayment: quote.installmentAmount,
      installmentAmount: quote.installmentAmount,
      outstandingBalance: newOutstanding,
      upfrontFeeAmount: quote.upfrontFee,
      openingFeeAmount: quote.openingFee,
      interestRate: flatInterestRate,
    },
  });

  return quote;
}

export type LoanRepricePreview = {
  total: number;
  legacyInterestCount: number;
  sample: Array<{
    id: string;
    loanNumber: string;
    status: LoanStatus;
    principalAmount: number;
    flatInterestAmount: number | null;
    customerName: string;
  }>;
};

export async function previewLoanInterestReprice(
  prisma: PrismaService,
  targetRate: number,
  allLoans: boolean,
): Promise<LoanRepricePreview> {
  const where = allLoans ? allLoansForBulkRepriceWhere() : repriceableLoansWhere();
  const loans = await prisma.loan.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      loanNumber: true,
      status: true,
      principalAmount: true,
      flatInterestAmount: true,
      customer: { select: { firstName: true, lastName: true } },
    },
  });

  let legacyInterestCount = 0;
  for (const loan of loans) {
    if (
      loanUsedLegacyFlatInterest(
        Number(loan.principalAmount),
        Number(loan.flatInterestAmount ?? 0),
        targetRate,
      )
    ) {
      legacyInterestCount += 1;
    }
  }

  return {
    total: loans.length,
    legacyInterestCount,
    sample: loans.slice(0, 10).map((l) => ({
      id: l.id,
      loanNumber: l.loanNumber,
      status: l.status,
      principalAmount: Number(l.principalAmount),
      flatInterestAmount: l.flatInterestAmount != null ? Number(l.flatInterestAmount) : null,
      customerName: `${l.customer.firstName} ${l.customer.lastName}`.trim(),
    })),
  };
}
