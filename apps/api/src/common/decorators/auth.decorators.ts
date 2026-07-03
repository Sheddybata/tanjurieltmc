import { SetMetadata } from '@nestjs/common';
import { UserRole, Permission } from '@tanjuriel/shared';

export const ROLES_KEY = 'roles';
export const PERMISSIONS_KEY = 'permissions';
export const PUBLIC_KEY = 'isPublic';
export const AUDIT_SKIP_KEY = 'auditSkip';

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
export const Permissions = (...permissions: Permission[]) => SetMetadata(PERMISSIONS_KEY, permissions);
export const Public = () => SetMetadata(PUBLIC_KEY, true);
export const AuditSkip = () => SetMetadata(AUDIT_SKIP_KEY, true);

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '@tanjuriel/shared';

export const User = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext): JwtPayload | unknown => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    return data ? user?.[data] : user;
  },
);
