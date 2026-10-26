import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { LoanStatus } from '@tanjuriel/database';
import { Permission, JwtPayload } from '@tanjuriel/shared';
import { ManagerService } from './manager.service';
import {
  AssignAccountOfficerDto,
  DeleteLoanDto,
  LoanActionDto,
  ManagerApplyLoanDto,
  ManagerLoanQuoteDto,
} from './dto/manager.dto';
import { JwtAuthGuard, PermissionsGuard } from '../../common/guards/auth.guards';
import { Permissions, User } from '../../common/decorators/auth.decorators';
import {
  collateralPhotoFilter,
  collateralPhotoPublicPath,
  collateralPhotoStorage,
} from '../../common/utils/collateral-upload.util';

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

  @Get('account-officers/options')
  @Permissions(Permission.ASSIGN_ACCOUNT_OFFICER)
  @ApiOperation({ summary: 'List account officer names for assignment' })
  async accountOfficerOptions() {
    return { success: true, data: this.managerService.getAccountOfficerOptions() };
  }

  @Get('members/with-accounts')
  @Permissions(Permission.ASSIGN_ACCOUNT_OFFICER)
  @ApiOperation({ summary: 'List members who have at least one account (for account officer assignment)' })
  async listMembersWithAccounts(
    @Query('query') query?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('assignment') assignment?: 'all' | 'assigned' | 'unassigned',
  ) {
    const filter = assignment === 'assigned' || assignment === 'unassigned' ? assignment : 'all';
    const result = await this.managerService.listMembersWithAccounts(
      query,
      Number(page) || 1,
      Number(limit) || 50,
      filter,
    );
    return { success: true, ...result };
  }

  @Patch('customers/:id/account-officer')
  @Permissions(Permission.ASSIGN_ACCOUNT_OFFICER)
  @ApiOperation({ summary: 'Assign account officer to a member (applies to all their products)' })
  async assignAccountOfficer(
    @Param('id') id: string,
    @User() user: JwtPayload,
    @Body() dto: AssignAccountOfficerDto,
  ) {
    const data = await this.managerService.assignAccountOfficer(id, user, dto);
    return { success: true, data };
  }

  @Get('customers')
  @Permissions(Permission.CREATE_LOAN)
  @ApiOperation({ summary: 'List customers for loan application' })
  async listCustomers(
    @Query('query') query?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.managerService.listCustomers(query, Number(page) || 1, Number(limit) || 100);
    return { success: true, ...result };
  }

  @Get('customers/:id')
  @Permissions(Permission.CREATE_LOAN)
  @ApiOperation({ summary: 'Get customer profile for loan prefill' })
  async getCustomer(@Param('id') id: string) {
    const data = await this.managerService.getCustomerForLoan(id);
    return { success: true, data };
  }

  @Post('loans/quote')
  @Permissions(Permission.CREATE_LOAN)
  @ApiOperation({ summary: 'Preview loan fees and repayment schedule' })
  async quoteLoan(@Body() dto: ManagerLoanQuoteDto) {
    const data = await this.managerService.quoteLoan(dto);
    return { success: true, data };
  }

  @Post('loans')
  @Permissions(Permission.CREATE_LOAN)
  @ApiOperation({ summary: 'Create and submit a loan application (same fields as mobile)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('collateralPhoto', {
      storage: collateralPhotoStorage,
      fileFilter: collateralPhotoFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async createLoan(
    @Body() dto: ManagerApplyLoanDto,
    @User() user: JwtPayload,
    @UploadedFile() collateralPhoto?: Express.Multer.File,
  ) {
    if (!collateralPhoto) {
      throw new BadRequestException(
        'Collateral photo was not received. Use JPG or PNG under 5MB and try again.',
      );
    }
    const photoUrl = collateralPhotoPublicPath(collateralPhoto.filename);
    const loan = await this.managerService.createLoanApplication(dto, user, photoUrl);
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

  @Delete('loans/:id')
  @Permissions(Permission.DELETE_LOAN)
  @ApiOperation({ summary: 'Permanently delete a loan (including disbursed duplicates with confirmation)' })
  async deleteLoan(@Param('id') id: string, @User() user: JwtPayload, @Body() dto: DeleteLoanDto) {
    const result = await this.managerService.deleteLoan(id, user, dto);
    return { success: true, data: result };
  }

  @Get('portfolio')
  @Permissions(Permission.VIEW_PORTFOLIO)
  @ApiOperation({ summary: 'Get portfolio monitoring summary' })
  async getPortfolio() {
    const portfolio = await this.managerService.getPortfolioSummary();
    return { success: true, data: portfolio };
  }
}
