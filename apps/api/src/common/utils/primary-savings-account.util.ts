import { AccountStatus, AccountType, Prisma } from '@tanjuriel/database';
import { PrismaService } from '../prisma/prisma.service';
import { generateAccountNumber, generatePaymentRef } from './reference.util';

type Db = PrismaService | Prisma.TransactionClient;

const OPEN_SAVINGS_STATUSES: AccountStatus[] = [
  AccountStatus.PENDING,
  AccountStatus.ACTIVE,
  AccountStatus.DORMANT,
  AccountStatus.FROZEN,
];

export async function findPrimarySavingsAccount(db: Db, customerId: string) {
  return db.account.findFirst({
    where: {
      customerId,
      type: AccountType.SAVINGS,
      status: { in: OPEN_SAVINGS_STATUSES },
    },
    orderBy: { createdAt: 'asc' },
  });
}

/** Creates a standard Savings account when the member has none; updates payment ref from account number. */
export async function ensurePrimarySavingsAccount(
  db: Prisma.TransactionClient,
  input: { customerId: string; branchId: string; openedById: string },
): Promise<{ created: boolean; accountNumber: string }> {
  const existing = await findPrimarySavingsAccount(db, input.customerId);
  if (existing) {
    return { created: false, accountNumber: existing.accountNumber };
  }

  const accountNumber = generateAccountNumber();
  await db.account.create({
    data: {
      accountNumber,
      type: AccountType.SAVINGS,
      status: AccountStatus.ACTIVE,
      customerId: input.customerId,
      branchId: input.branchId,
      openedById: input.openedById,
      openedAt: new Date(),
    },
  });

  await db.customer.update({
    where: { id: input.customerId },
    data: { paymentRef: generatePaymentRef(accountNumber) },
  });

  return { created: true, accountNumber };
}

export async function syncCustomerPaymentRefFromSavings(db: Db, customerId: string): Promise<boolean> {
  const savings = await findPrimarySavingsAccount(db, customerId);
  if (!savings) return false;
  await db.customer.update({
    where: { id: customerId },
    data: { paymentRef: generatePaymentRef(savings.accountNumber) },
  });
  return true;
}

export function customersMissingPrimarySavingsWhere(): Prisma.CustomerWhereInput {
  return {
    accounts: {
      none: {
        type: AccountType.SAVINGS,
        status: { in: OPEN_SAVINGS_STATUSES },
      },
    },
  };
}
