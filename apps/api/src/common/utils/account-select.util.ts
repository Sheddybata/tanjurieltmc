import { AccountStatus, Prisma } from '@tanjuriel/database';

/** Account fields that exist on all deployed databases (excludes label/maturityDate until migration runs). */
export const customerAccountSelect = {
  id: true,
  accountNumber: true,
  type: true,
  status: true,
  balance: true,
  availableBalance: true,
  heldBalance: true,
  currency: true,
  interestRate: true,
  customerId: true,
  branchId: true,
  openedAt: true,
  closedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AccountSelect;

export const customerAccountsInclude = {
  where: { status: { in: [AccountStatus.ACTIVE, AccountStatus.PENDING] } },
  orderBy: { createdAt: 'asc' as const },
  select: customerAccountSelect,
};
