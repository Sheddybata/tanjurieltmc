import { LoanRepaymentPlan } from '@tanjuriel/database';

export const LOAN_OPENING_FEE_NGN = 1000;
export const LOAN_UPFRONT_FEE_RATE = 0.1;
export const LOAN_FLAT_INTEREST_RATE = 0.1;

export interface LoanQuoteInput {
  principalAmount: number;
  tenurePeriods: number;
  repaymentPlan: LoanRepaymentPlan;
}

export interface LoanQuoteScheduleItem {
  installmentNumber: number;
  dueDate: Date;
  principalDue: number;
  interestDue: number;
  totalDue: number;
}

export interface LoanQuoteResult {
  openingFee: number;
  upfrontFee: number;
  flatInterestAmount: number;
  totalRepayable: number;
  installmentAmount: number;
  netDisbursement: number;
  tenureMonths: number;
  schedule: LoanQuoteScheduleItem[];
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function addPeriod(date: Date, plan: LoanRepaymentPlan, count: number): Date {
  const next = new Date(date);
  if (plan === LoanRepaymentPlan.DAILY) {
    next.setDate(next.getDate() + count);
  } else if (plan === LoanRepaymentPlan.WEEKLY) {
    next.setDate(next.getDate() + count * 7);
  } else {
    next.setMonth(next.getMonth() + count);
  }
  return next;
}

export function tenureMonthsEquivalent(tenurePeriods: number, plan: LoanRepaymentPlan): number {
  if (plan === LoanRepaymentPlan.DAILY) return Math.max(1, Math.ceil(tenurePeriods / 30));
  if (plan === LoanRepaymentPlan.WEEKLY) return Math.max(1, Math.ceil(tenurePeriods / 4));
  return Math.max(1, tenurePeriods);
}

export function calculateTanjuielLoanQuote(input: LoanQuoteInput): LoanQuoteResult {
  const principal = input.principalAmount;
  const periods = Math.max(1, input.tenurePeriods);

  const openingFee = LOAN_OPENING_FEE_NGN;
  const upfrontFee = roundMoney(principal * LOAN_UPFRONT_FEE_RATE);
  const flatInterestAmount = roundMoney(principal * LOAN_FLAT_INTEREST_RATE);
  const totalRepayable = roundMoney(principal + flatInterestAmount);
  const installmentAmount = roundMoney(totalRepayable / periods);
  const netDisbursement = roundMoney(principal - upfrontFee);

  const schedule: LoanQuoteScheduleItem[] = [];
  const startDate = new Date();
  let allocated = 0;

  for (let i = 1; i <= periods; i++) {
    const isLast = i === periods;
    const totalDue = isLast ? roundMoney(totalRepayable - allocated) : installmentAmount;
    allocated = roundMoney(allocated + totalDue);
    const principalDue = isLast
      ? roundMoney(principal - schedule.reduce((s, x) => s + x.principalDue, 0))
      : roundMoney(principal / periods);
    const interestDue = isLast
      ? roundMoney(flatInterestAmount - schedule.reduce((s, x) => s + x.interestDue, 0))
      : roundMoney(flatInterestAmount / periods);

    schedule.push({
      installmentNumber: i,
      dueDate: addPeriod(startDate, input.repaymentPlan, i),
      principalDue,
      interestDue,
      totalDue,
    });
  }

  return {
    openingFee,
    upfrontFee,
    flatInterestAmount,
    totalRepayable,
    installmentAmount,
    netDisbursement,
    tenureMonths: tenureMonthsEquivalent(periods, input.repaymentPlan),
    schedule,
  };
}

export const LOAN_PRODUCT_CODE_BY_CATEGORY: Record<string, string> = {
  PERSONAL: 'PERS-001',
  BUSINESS: 'SME-001',
  ASSET_FINANCING: 'ASSET-001',
};

export function repaymentPlanLabel(plan: LoanRepaymentPlan): string {
  switch (plan) {
    case LoanRepaymentPlan.DAILY:
      return 'day';
    case LoanRepaymentPlan.WEEKLY:
      return 'week';
    default:
      return 'month';
  }
}
