import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuditAction } from '@tanjuriel/database';
import { Permission } from '@tanjuriel/shared';
import { AuditService } from './audit.service';
import { JwtAuthGuard, PermissionsGuard } from '../../common/guards/auth.guards';
import { Permissions } from '../../common/decorators/auth.decorators';

@ApiTags('Audit')
@Controller('audit')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get('logs')
  @Permissions(Permission.VIEW_AUDIT_LOGS)
  @ApiOperation({ summary: 'Query audit logs with filters' })
  async getLogs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('action') action?: AuditAction,
    @Query('entityType') entityType?: string,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const result = await this.auditService.findAll({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      action,
      entityType,
      userId,
      startDate,
      endDate,
    });
    return { success: true, ...result };
  }
}
