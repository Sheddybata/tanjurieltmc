import { AccountType } from '@tanjuriel/database';
import { generatePaymentRef } from './reference.util';

type AccountLike = {
  accountNumber: string;
  type?: AccountType | string;
  createdAt?: Date;
};

/** Public member ID shown on receipts and screens — primary (Savings) or first account number. */
export function primaryMemberAccountNumber(accounts: AccountLike[]): string | null {
  if (!accounts?.length) return null;

  const savings = accounts.find(
    (a) => a.type === AccountType.SAVINGS || a.type === 'SAVINGS',
  );
  if (savings) return savings.accountNumber;

  const sorted = [...accounts].sort(
    (a, b) => (a.createdAt?.getTime?.() ?? 0) - (b.createdAt?.getTime?.() ?? 0),
  );
  return sorted[0]?.accountNumber ?? null;
}

/** Bank transfer narration reference derived from the member's account number. */
export function memberPaymentRef(accounts: AccountLike[], storedRef?: string | null): string | null {
  const accountNumber = primaryMemberAccountNumber(accounts);
  if (accountNumber) return generatePaymentRef(accountNumber);
  return storedRef ?? null;
}
