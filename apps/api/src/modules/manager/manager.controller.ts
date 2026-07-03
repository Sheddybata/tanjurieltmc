import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LoanStatus } from '@tanjuriel/database';
import { Permission, JwtPayload } from '@tanjuriel/shared';
import { ManagerService } from './manager.service';
import { CreateLoanDto, LoanActionDto } from './dto/manager.dto';
import { JwtAuthGuard, PermissionsGuard } from '../../common/guards/auth.guards';
import { Permissions, User } from '../../common/decorators/auth.decorators';

@ApiTags('Manager')
@Controller('manager')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class ManagerController {
  constructor(private managerService: ManagerService) {}

  @Get('loan-products')
  @Permissions(Permission.VIEW_LOANS)
  @ApiOperation({ summary: 'List active loan products' })
  async getProducts() {
    const products = await this.managerService.getLoanProducts();
    return { success: true, data: products };
  }

  @Post('loans')
  @Permissions(Permission.CREATE_LOAN)
  @ApiOperation({ summary: 'Create and submit a loan application' })
  async createLoan(@Body() dto: CreateLoanDto, @User() user: JwtPayload) {
    const loan = await this.managerService.createLoanApplication(dto, user);
    return { success: true, data: loan };
  }

  @Get('loans')
  @Permissions(Permission.VIEW_LOANS)
  @ApiOperation({ summary: 'List loans with optional status filter' })
  async getLoans(
    @Query('status') status?: LoanStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.managerService.getLoans(status, Number(page) || 1, Number(limit) || 20);
    return { success: true, ...result };
  }

  @Get('loans/:id')
  @Permissions(Permission.VIEW_LOANS)
  @ApiOperation({ summary: 'Get loan details with schedule and approval history' })
  async getLoan(@Param('id') id: string) {
    const loan = await this.managerService.getLoan(id);
    return { success: true, data: loan };
  }

  @Post('loans/:id/review')
  @Permissions(Permission.REVIEW_LOAN)
  @ApiOperation({ summary: 'Move loan to under review' })
  async reviewLoan(@Param('id') id: string, @User() user: JwtPayload, @Body() dto: LoanActionDto) {
    const loan = await this.managerService.reviewLoan(id, user, dto);
    return { success: true, data: loan };
  }

  @Post('loans/:id/approve')
  @Permissions(Permission.APPROVE_LOAN)
  @ApiOperation({ summary: 'Approve a loan application' })
  async approveLoan(@Param('id') id: string, @User() user: JwtPayload, @Body() dto: LoanActionDto) {
    const loan = await this.managerService.approveLoan(id, user, dto);
    return { success: true, data: loan };
  }

  @Post('loans/:id/verify-collateral')
  @Permissions(Permission.APPROVE_LOAN)
  @ApiOperation({ summary: 'Verify submitted loan collateral' })
  async verifyCollateral(@Param('id') id: string, @User() user: JwtPayload, @Body() dto: LoanActionDto) {
    const loan = await this.managerService.verifyCollateral(id, user, dto);
    return { success: true, data: loan };
  }

  @Post('loans/:id/reject')
  @Permissions(Permission.APPROVE_LOAN)
  @ApiOperation({ summary: 'Reject a loan application' })
  async rejectLoan(@Param('id') id: string, @User() user: JwtPayload, @Body() dto: LoanActionDto) {
    const loan = await this.managerService.rejectLoan(id, user, dto);
    return { success: true, data: loan };
  }

  @Post('loans/:id/disburse')
  @Permissions(Permission.DISBURSE_LOAN)
  @ApiOperation({ summary: 'Disburse approved loan to customer account' })
  async disburseLoan(@Param('id') id: string, @User() user: JwtPayload, @Body() dto: LoanActionDto) {
    const loan = await this.managerService.disburseLoan(id, user, dto);
    return { success: true, data: loan };
  }

  @Get('portfolio')
  @Permissions(Permission.VIEW_PORTFOLIO)
  @ApiOperation({ summary: 'Get portfolio monitoring summary' })
  async getPortfolio() {
    const portfolio = await this.managerService.getPortfolioSummary();
    return { success: true, data: portfolio };
  }
}
