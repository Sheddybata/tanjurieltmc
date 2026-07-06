export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  SAVINGS: 'Savings',
  DAILY_SAVINGS: 'Daily Savings',
  MY_PIKIN: 'My Pikin',
  CURRENT: 'Current',
  FIXED_DEPOSIT: 'Fixed Deposit',
};

export function accountTypeLabel(type: string): string {
  return ACCOUNT_TYPE_LABELS[type] ?? type.replace(/_/g, ' ');
}
