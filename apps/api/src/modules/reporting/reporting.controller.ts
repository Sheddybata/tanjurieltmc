import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
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

  @Get('branches')
  @Permissions(Permission.VIEW_REPORTS)
  @ApiOperation({ summary: 'Branches for report filters' })
  async getBranches() {
    const data = await this.reportingService.getReportBranches();
    return { success: true, data };
  }

  @Get('transactions')
  @Permissions(Permission.VIEW_REPORTS)
  @ApiOperation({ summary: 'Transaction report for date range with filters' })
  async getTransactionReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('branchId') branchId?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    const report = await this.reportingService.getTransactionReport({
      startDate,
      endDate,
      branchId,
      type,
      status,
    });
    return { success: true, data: report };
  }

  @Get('transactions.pdf')
  @Permissions(Permission.EXPORT_REPORTS)
  @ApiOperation({ summary: 'Download transaction report PDF' })
  async getTransactionReportPdf(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('branchId') branchId: string | undefined,
    @Query('type') type: string | undefined,
    @Query('status') status: string | undefined,
    @Res() res: Response,
  ) {
    const pdf = await this.reportingService.generateTransactionReportPdf({
      startDate,
      endDate,
      branchId,
      type,
      status,
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="transaction-report-${startDate}-${endDate}.pdf"`,
    );
    res.send(pdf);
  }

  @Get('trends')
  @Permissions(Permission.VIEW_REPORTS)
  @ApiOperation({ summary: 'Daily deposit/withdrawal trends' })
  async getTrends(@Query('days') days?: number) {
    const trends = await this.reportingService.getDailyTrends(Number(days) || 30);
    return { success: true, data: trends };
  }
}
