import { Controller, Get, Post, Body, Param, Query, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Permission, JwtPayload } from '@tanjuriel/shared';
import { TellerService } from './teller.service';
import { RegisterCustomerDto, OpenAccountDto, TransactionDto, EnableMobileAccessDto, LoanRepaymentDto } from './dto/teller.dto';
import { JwtAuthGuard, PermissionsGuard } from '../../common/guards/auth.guards';
import { Permissions, User } from '../../common/decorators/auth.decorators';

@ApiTags('Teller')
@Controller('teller')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class TellerController {
  constructor(private tellerService: TellerService) {}

  @Post('customers')
  @Permissions(Permission.REGISTER_CUSTOMER)
  @ApiOperation({ summary: 'Register a new customer' })
  async registerCustomer(@Body() dto: RegisterCustomerDto, @User() user: JwtPayload) {
    const customer = await this.tellerService.registerCustomer(dto, user);
    return { success: true, data: customer };
  }

  @Get('customers')
  @Permissions(Permission.VIEW_CUSTOMERS)
  @ApiOperation({ summary: 'Search customers' })
  async searchCustomers(
    @Query('query') query?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.tellerService.searchCustomers(query || '', Number(page) || 1, Number(limit) || 20);
    return { success: true, ...result };
  }

  @Get('customers/pending-kyc')
  @Permissions(Permission.VIEW_CUSTOMERS)
  @ApiOperation({ summary: 'List mobile self-registrations pending KYC' })
  async pendingKyc(@Query('page') page?: number, @Query('limit') limit?: number) {
    const result = await this.tellerService.listPendingKyc(Number(page) || 1, Number(limit) || 20);
    return { success: true, ...result };
  }

  @Patch('customers/:id/verify-kyc')
  @Permissions(Permission.REGISTER_CUSTOMER)
  @ApiOperation({ summary: 'Approve customer KYC after document review' })
  async verifyKyc(@Param('id') id: string, @User() user: JwtPayload) {
    const customer = await this.tellerService.verifyCustomerKyc(id, user);
    return { success: true, data: customer };
  }

  @Patch('customers/:id/reject-kyc')
  @Permissions(Permission.REGISTER_CUSTOMER)
  @ApiOperation({ summary: 'Reject customer KYC' })
  async rejectKyc(@Param('id') id: string, @Body('reason') reason?: string) {
    const customer = await this.tellerService.rejectCustomerKyc(id, reason);
    return { success: true, data: customer };
  }

  @Get('customers/:id')
  @Permissions(Permission.VIEW_CUSTOMERS)
  @ApiOperation({ summary: 'Get customer details' })
  async getCustomer(@Param('id') id: string) {
    const customer = await this.tellerService.getCustomer(id);
    return { success: true, data: customer };
  }

  @Post('accounts')
  @Permissions(Permission.OPEN_ACCOUNT)
  @ApiOperation({ summary: 'Open a new account for a customer' })
  async openAccount(@Body() dto: OpenAccountDto, @User() user: JwtPayload) {
    const account = await this.tellerService.openAccount(dto, user);
    return { success: true, data: account };
  }

  @Post('deposits')
  @Permissions(Permission.PROCESS_DEPOSIT)
  @ApiOperation({ summary: 'Process a cash deposit' })
  async deposit(@Body() dto: TransactionDto, @User() user: JwtPayload) {
    const result = await this.tellerService.processDeposit(dto, user);
    return { success: true, data: result };
  }

  @Post('withdrawals')
  @Permissions(Permission.PROCESS_WITHDRAWAL)
  @ApiOperation({ summary: 'Process a cash withdrawal' })
  async withdrawal(@Body() dto: TransactionDto, @User() user: JwtPayload) {
    const result = await this.tellerService.processWithdrawal(dto, user);
    return { success: true, data: result };
  }

  @Patch('customers/:id/mobile-access')
  @Permissions(Permission.OPEN_ACCOUNT)
  @ApiOperation({ summary: 'Enable mobile app access and set PIN for a customer' })
  async enableMobileAccess(@Param('id') id: string, @Body() dto: EnableMobileAccessDto) {
    const customer = await this.tellerService.enableMobileAccess(id, dto);
    return { success: true, data: customer };
  }

  @Post('loans/repay')
  @Permissions(Permission.PROCESS_DEPOSIT)
  @ApiOperation({ summary: 'Record cash loan repayment at branch (manager approval required)' })
  async loanRepayment(@Body() dto: LoanRepaymentDto, @User() user: JwtPayload) {
    const result = await this.tellerService.processLoanRepayment(dto, user);
    return { success: true, data: result };
  }

  @Get('accounts/:accountId/transactions')
  @Permissions(Permission.VIEW_TRANSACTIONS)
  @ApiOperation({ summary: 'Get account transaction history' })
  async getTransactions(
    @Param('accountId') accountId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.tellerService.getTransactions(accountId, Number(page) || 1, Number(limit) || 20);
    return { success: true, ...result };
  }
}
