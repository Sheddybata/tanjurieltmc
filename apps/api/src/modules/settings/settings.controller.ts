import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SettlementProvider } from '@tanjuriel/database';
import { JwtPayload, Permission } from '@tanjuriel/shared';
import { Permissions, User } from '../../common/decorators/auth.decorators';
import { JwtAuthGuard, PermissionsGuard, StaffGuard } from '../../common/guards/auth.guards';
import { SettingsService } from './settings.service';
import { UpdateSettlementAccountDto } from './dto/settings.dto';
import {
  RecalculateLoansInterestDto,
  RecalculateSingleLoanDto,
  UpdateLoanFlatInterestRateDto,
} from './dto/loan-pricing-settings.dto';

@ApiTags('Settings')
@Controller('settings')
@UseGuards(JwtAuthGuard, StaffGuard, PermissionsGuard)
@ApiBearerAuth()
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get('settlement-accounts')
  @Permissions(Permission.SYSTEM_SETTINGS, Permission.MANAGE_SETTLEMENT_ACCOUNTS)
  @ApiOperation({ summary: 'List settlement bank accounts' })
  async listSettlementAccounts() {
    const data = await this.settingsService.listSettlementAccounts();
    return { success: true, data };
  }

  @Put('settlement-accounts/:provider')
  @Permissions(Permission.MANAGE_SETTLEMENT_ACCOUNTS)
  @ApiOperation({ summary: 'Update settlement bank account' })
  async updateSettlementAccount(
    @Param('provider') provider: SettlementProvider,
    @Body() dto: UpdateSettlementAccountDto,
  ) {
    const data = await this.settingsService.updateSettlementAccount(provider, dto);
    return { success: true, data };
  }

  @Get('member-accounts/backfill-preview')
  @Permissions(Permission.SYSTEM_SETTINGS)
  @ApiOperation({ summary: 'Count customers missing a primary Savings account number' })
  async previewMemberAccountBackfill() {
    const data = await this.settingsService.previewMissingPrimarySavingsAccounts();
    return { success: true, data };
  }

  @Post('member-accounts/backfill')
  @Permissions(Permission.SYSTEM_SETTINGS)
  @ApiOperation({ summary: 'Open Savings accounts for members who have none (one-time / repair)' })
  async backfillMemberAccounts(@User() user: JwtPayload) {
    const data = await this.settingsService.backfillMissingPrimarySavingsAccounts(user.sub);
    return { success: true, data };
  }

  @Get('loan-pricing')
  @Permissions(Permission.SYSTEM_SETTINGS)
  @ApiOperation({ summary: 'Platform loan flat interest rate (new applications)' })
  async getLoanPricing() {
    const data = await this.settingsService.getLoanPricingConfig();
    return { success: true, data };
  }

  @Put('loan-pricing')
  @Permissions(Permission.SYSTEM_SETTINGS)
  @ApiOperation({ summary: 'Set default flat interest rate for new loan quotes' })
  async updateLoanPricing(@Body() dto: UpdateLoanFlatInterestRateDto) {
    const data = await this.settingsService.setLoanFlatInterestRate(dto.flatInterestRate);
    return { success: true, data };
  }

  @Get('loans/interest-reprice-preview')
  @Permissions(Permission.SYSTEM_SETTINGS)
  @ApiOperation({ summary: 'Preview loans eligible for interest recalculation (?scope=all for every active loan)' })
  async previewLoanInterestReprice(@Query('scope') scope?: string) {
    const applyToAllLoans = scope === 'all';
    const data = await this.settingsService.previewLoanInterestReprice(applyToAllLoans);
    return { success: true, data };
  }

  @Post('loans/recalculate-interest')
  @Permissions(Permission.SYSTEM_SETTINGS)
  @ApiOperation({ summary: 'Bulk recalculate loan interest and schedules' })
  async recalculateLoanInterest(@Body() dto: RecalculateLoansInterestDto) {
    const data = await this.settingsService.recalculateLoansInterest(dto);
    return { success: true, data };
  }

  @Post('loans/recalculate-one')
  @Permissions(Permission.SYSTEM_SETTINGS)
  @ApiOperation({ summary: 'Recalculate a single loan by loan number or id' })
  async recalculateSingleLoan(@Body() dto: RecalculateSingleLoanDto) {
    const data = await this.settingsService.recalculateSingleLoanInterest(dto);
    return { success: true, data };
  }
}
