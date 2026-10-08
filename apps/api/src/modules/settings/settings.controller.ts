import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SettlementProvider } from '@tanjuriel/database';
import { JwtPayload, Permission } from '@tanjuriel/shared';
import { Permissions, User } from '../../common/decorators/auth.decorators';
import { JwtAuthGuard, PermissionsGuard, StaffGuard } from '../../common/guards/auth.guards';
import { SettingsService } from './settings.service';
import { UpdateSettlementAccountDto } from './dto/settings.dto';

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
}
