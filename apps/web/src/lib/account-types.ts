export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  SAVINGS: 'Savings',
  DAILY_SAVINGS: 'Daily Savings',
  MY_PIKIN: 'My Pikin Savings',
  CURRENT: 'Current',
  FIXED_DEPOSIT: 'Fixed Deposit',
};

/** Account types tellers can open at the branch desk */
export const TELLER_OPEN_ACCOUNT_TYPES = [
  { value: 'SAVINGS', label: 'Savings Account' },
  { value: 'DAILY_SAVINGS', label: 'Daily Savings' },
  { value: 'MY_PIKIN', label: 'My Pikin Savings' },
] as const;

export function accountTypeLabel(type: string): string {
  return ACCOUNT_TYPE_LABELS[type] ?? type.replace(/_/g, ' ');
}
