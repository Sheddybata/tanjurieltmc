import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Permission } from '@tanjuriel/shared';
import { ReportingService } from './reporting.service';
import { JwtAuthGuard, PermissionsGuard } from '../../common/guards/auth.guards';
import { Permissions } from '../../common/decorators/auth.decorators';

@ApiTags('Reporting')
@Controller('reporting')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class ReportingController {
  constructor(private reportingService: ReportingService) {}

  @Get('dashboard')
  @Permissions(Permission.VIEW_DASHBOARD)
  @ApiOperation({ summary: 'Real-time dashboard metrics' })
  async getDashboard() {
    const metrics = await this.reportingService.getDashboardMetrics();
    return { success: true, data: metrics };
  }

  @Get('transactions')
  @Permissions(Permission.VIEW_REPORTS)
  @ApiOperation({ summary: 'Transaction report for date range' })
  async getTransactionReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const report = await this.reportingService.getTransactionReport(startDate, endDate);
    return { success: true, data: report };
  }

  @Get('trends')
  @Permissions(Permission.VIEW_REPORTS)
  @ApiOperation({ summary: 'Daily deposit/withdrawal trends' })
  async getTrends(@Query('days') days?: number) {
    const trends = await this.reportingService.getDailyTrends(Number(days) || 30);
    return { success: true, data: trends };
  }
}
