import { User } from '@tanjuriel/database';
import { JwtPayload, UserRole } from '@tanjuriel/shared';

export function staffJwtPayloadFromUser(user: Pick<User, 'id' | 'email' | 'role' | 'branchId' | 'employeeId' | 'accountOfficer'>): JwtPayload {
  return {
    sub: user.id,
    authType: 'staff',
    email: user.email,
    role: user.role as UserRole,
    branchId: user.branchId ?? undefined,
    employeeId: user.employeeId,
    accountOfficer: user.accountOfficer ?? undefined,
  };
}
