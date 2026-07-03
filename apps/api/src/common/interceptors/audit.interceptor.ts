import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { AuditAction } from '@tanjuriel/database';
import { JwtPayload } from '@tanjuriel/shared';
import { AUDIT_SKIP_KEY } from '../decorators/auth.decorators';
import { AuditService } from '../../modules/audit/audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const skip = this.reflector.getAllAndOverride<boolean>(AUDIT_SKIP_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return next.handle();

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload | undefined;
    const method = request.method;
    const path = request.route?.path || request.url;

    const actionMap: Record<string, AuditAction> = {
      POST: AuditAction.CREATE,
      PUT: AuditAction.UPDATE,
      PATCH: AuditAction.UPDATE,
      DELETE: AuditAction.DELETE,
    };

    const action = actionMap[method];
    if (!action || !user) return next.handle();

    const entityType = this.extractEntityType(path);

    return next.handle().pipe(
      tap(async (responseBody) => {
        try {
          await this.auditService.log({
            action,
            entityType,
            entityId: responseBody?.data?.id || request.params?.id,
            userId: user.sub,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'],
            newValues: method !== 'DELETE' ? request.body : undefined,
            metadata: { method, path },
          });
        } catch {
          // audit failures must not block business operations
        }
      }),
    );
  }

  private extractEntityType(path: string): string {
    const segments = path.split('/').filter(Boolean);
    const apiIndex = segments.indexOf('v1');
    return apiIndex >= 0 && segments[apiIndex + 1] ? segments[apiIndex + 1] : 'unknown';
  }
}
