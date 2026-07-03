import { Injectable } from '@nestjs/common';
import { AuditAction, Prisma } from '@tanjuriel/database';
import { PrismaService } from '../../common/prisma/prisma.service';
import { paginate, paginationMeta } from '../../common/utils/reference.util';

export interface AuditLogInput {
  action: AuditAction;
  entityType: string;
  entityId?: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  oldValues?: Prisma.InputJsonValue;
  newValues?: Prisma.InputJsonValue;
  metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(input: AuditLogInput) {
    return this.prisma.auditLog.create({ data: input });
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    action?: AuditAction;
    entityType?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { skip, take, page, limit } = paginate(query.page, query.limit);

    const where: Prisma.AuditLogWhereInput = {};
    if (query.action) where.action = query.action;
    if (query.entityType) where.entityType = query.entityType;
    if (query.userId) where.userId = query.userId;
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data: logs, meta: paginationMeta(total, page, limit) };
  }
}
