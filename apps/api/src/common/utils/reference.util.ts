import { v4 as uuidv4 } from 'uuid';
import {
  ACCOUNT_NUMBER_PREFIX,
  CUSTOMER_NUMBER_PREFIX,
  LOAN_NUMBER_PREFIX,
  TRANSACTION_REF_PREFIX,
  PAYMENT_REQUEST_REF_PREFIX,
  PAYMENT_REF_PREFIX,
} from '@tanjuriel/shared';

export function generateReference(prefix: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = uuidv4().split('-')[0].toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

export function generateAccountNumber(): string {
  return String(Math.floor(1000000000 + Math.random() * 9000000000));
}

export function generateCustomerNumber(): string {
  return generateReference(CUSTOMER_NUMBER_PREFIX);
}

export function generateLoanNumber(): string {
  return generateReference(LOAN_NUMBER_PREFIX);
}

export function generateTransactionRef(): string {
  return generateReference(TRANSACTION_REF_PREFIX);
}

export function generatePaymentRequestRef(): string {
  return generateReference(PAYMENT_REQUEST_REF_PREFIX);
}

/** Payment narration reference — uses the member's 10-digit account number. */
export function generatePaymentRef(accountNumber: string): string {
  return `${PAYMENT_REF_PREFIX}-${accountNumber}`;
}

export function calculateLoanSchedule(
  principal: number,
  annualRate: number,
  tenureMonths: number,
): { monthlyPayment: number; totalRepayable: number; schedule: Array<{ installmentNumber: number; dueDate: Date; principalDue: number; interestDue: number; totalDue: number }> } {
  const monthlyRate = annualRate / 12;
  const monthlyPayment =
    monthlyRate === 0
      ? principal / tenureMonths
      : (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
        (Math.pow(1 + monthlyRate, tenureMonths) - 1);

  const schedule = [];
  let remaining = principal;
  const startDate = new Date();

  for (let i = 1; i <= tenureMonths; i++) {
    const interestDue = remaining * monthlyRate;
    const principalDue = monthlyPayment - interestDue;
    remaining -= principalDue;

    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    schedule.push({
      installmentNumber: i,
      dueDate,
      principalDue: Math.round(principalDue * 100) / 100,
      interestDue: Math.round(interestDue * 100) / 100,
      totalDue: Math.round(monthlyPayment * 100) / 100,
    });
  }

  const totalRepayable = schedule.reduce((sum, s) => sum + s.totalDue, 0);

  return {
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    totalRepayable: Math.round(totalRepayable * 100) / 100,
    schedule,
  };
}

export function paginate(page = 1, limit = 20) {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(100, Math.max(1, limit));
  return {
    skip: (safePage - 1) * safeLimit,
    take: safeLimit,
    page: safePage,
    limit: safeLimit,
  };
}

export function paginationMeta(total: number, page: number, limit: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
