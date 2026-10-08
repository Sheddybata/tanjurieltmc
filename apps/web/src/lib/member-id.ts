type AccountLike = { accountNumber: string; type?: string };

const PRIMARY_SAVINGS = 'SAVINGS';

/** Primary Savings account number for display (never phone). */
export function primaryMemberAccountNumber(accounts: AccountLike[] | undefined): string {
  if (!accounts?.length) return '—';
  const savings = accounts.find((a) => a.type === PRIMARY_SAVINGS);
  if (savings) return savings.accountNumber;
  return '—';
}

export function formatCustomerOptionLabel(
  firstName: string,
  lastName: string,
  accounts: AccountLike[] | undefined,
  phone: string,
): string {
  const memberId = primaryMemberAccountNumber(accounts);
  const idLabel = memberId === '—' ? 'no savings account' : memberId;
  return `${firstName} ${lastName} · ${idLabel} · ${phone}`;
}
