import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SettlementProvider } from '@tanjuriel/database';
import { Permission } from '@tanjuriel/shared';
import { Permissions } from '../../common/decorators/auth.decorators';
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
}
