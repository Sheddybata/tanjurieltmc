import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permission, JwtPayload } from '@tanjuriel/shared';
import { JwtAuthGuard, PermissionsGuard } from '../../common/guards/auth.guards';
import { Permissions, User } from '../../common/decorators/auth.decorators';
import { AccountOfficerPortalService } from './account-officer-portal.service';

@ApiTags('Account Officer')
@Controller('account-officer')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class AccountOfficerPortalController {
  constructor(private portal: AccountOfficerPortalService) {}

  @Get('me')
  @Permissions(Permission.VIEW_OWN_PORTFOLIO)
  @ApiOperation({ summary: 'Account officer profile' })
  me(@User() user: JwtPayload) {
    return { success: true, data: this.portal.getProfile(user) };
  }

  @Get('summary')
  @Permissions(Permission.VIEW_OWN_PORTFOLIO)
  @ApiOperation({ summary: 'Portfolio summary counts' })
  async summary(@User() user: JwtPayload) {
    const data = await this.portal.getSummary(user);
    return { success: true, data };
  }

  @Get('customers')
  @Permissions(Permission.VIEW_OWN_PORTFOLIO)
  @ApiOperation({ summary: 'Customers assigned to this account officer' })
  async customers(
    @User() user: JwtPayload,
    @Query('query') query?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.portal.listCustomers(user, query, Number(page) || 1, Number(limit) || 50);
    return { success: true, ...result };
  }

  @Get('customers/:id')
  @Permissions(Permission.VIEW_OWN_PORTFOLIO)
  @ApiOperation({ summary: 'Customer detail (read-only, own portfolio)' })
  async customer(@User() user: JwtPayload, @Param('id') id: string) {
    const data = await this.portal.getCustomer(user, id);
    return { success: true, data };
  }

  @Get('loan-follow-up')
  @Permissions(Permission.VIEW_OWN_PORTFOLIO)
  @ApiOperation({ summary: 'Upcoming and overdue loan installments for follow-up' })
  async loanFollowUp(
    @User() user: JwtPayload,
    @Query('filter') filter?: 'all' | 'overdue' | 'week',
  ) {
    const f = filter === 'overdue' || filter === 'week' ? filter : 'all';
    const data = await this.portal.listLoanFollowUp(user, f);
    return { success: true, data };
  }
}
