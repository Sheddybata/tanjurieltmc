import { AccountOfficer, Prisma } from '@tanjuriel/database';

export function accountOfficerAssignmentData(
  accountOfficer: AccountOfficer | undefined,
  assignedByUserId: string,
): Prisma.CustomerUncheckedUpdateInput {
  if (!accountOfficer) {
    return {};
  }
  return {
    accountOfficer,
    accountOfficerAssignedAt: new Date(),
    accountOfficerAssignedById: assignedByUserId,
  };
}

export function accountOfficerCreateFields(
  accountOfficer: AccountOfficer | undefined,
  assignedByUserId: string,
): Pick<
  Prisma.CustomerUncheckedCreateInput,
  'accountOfficer' | 'accountOfficerAssignedAt' | 'accountOfficerAssignedById'
> {
  if (!accountOfficer) {
    return {};
  }
  return {
    accountOfficer,
    accountOfficerAssignedAt: new Date(),
    accountOfficerAssignedById: assignedByUserId,
  };
}
