type AccountLike = { accountNumber: string; type?: string };

/** Public member ID — primary Savings account number, or first account, or phone fallback. */
export function primaryMemberAccountNumber(
  accounts: AccountLike[] | undefined,
  phone?: string,
): string {
  if (accounts?.length) {
    const savings = accounts.find((a) => a.type === 'SAVINGS');
    if (savings) return savings.accountNumber;
    return accounts[0].accountNumber;
  }
  return phone ?? '—';
}

export function formatCustomerOptionLabel(
  firstName: string,
  lastName: string,
  accounts: AccountLike[] | undefined,
  phone: string,
): string {
  const memberId = primaryMemberAccountNumber(accounts, phone);
  return `${firstName} ${lastName} (${memberId})`;
}
