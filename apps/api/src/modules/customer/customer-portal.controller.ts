import { Body, Controller, Get, Param, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from '../../common/decorators/auth.decorators';
import { CustomerGuard, JwtAuthGuard } from '../../common/guards/auth.guards';
import { CustomerJwtPayload } from '@tanjuriel/shared';
import {
  collateralPhotoFilter,
  collateralPhotoPublicPath,
  collateralPhotoStorage,
} from '../../common/utils/collateral-upload.util';
import { CustomerPortalService } from './customer-portal.service';
import { CustomerDepositRequestDto, CustomerTransferRequestDto, CustomerWithdrawalRequestDto } from '../operations/dto/operations.dto';
import { CustomerApplyLoanDto } from './dto/customer-loan.dto';
import { NameEnquiryDto } from './dto/transfer.dto';
@ApiTags('Customer App')
@Controller('customer')
@UseGuards(JwtAuthGuard, CustomerGuard)
@ApiBearerAuth()
export class CustomerPortalController {
  constructor(private customerPortalService: CustomerPortalService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get customer profile and accounts' })
  async profile(@User() user: CustomerJwtPayload) {
    const data = await this.customerPortalService.getProfile(user.customerId);
    return { success: true, data };
  }

  @Get('settlement-accounts')
  @ApiOperation({ summary: 'Get company bank accounts for funding' })
  async settlementAccounts() {
    const data = await this.customerPortalService.getSettlementAccounts();
    return { success: true, data };
  }

  @Post('deposit-requests')
  @ApiOperation({ summary: 'Submit a bank transfer deposit request' })
  async depositRequest(@User() user: CustomerJwtPayload, @Body() dto: CustomerDepositRequestDto) {
    const data = await this.customerPortalService.createDepositRequest(user.customerId, dto);
    return { success: true, data };
  }

  @Get('transfers/banks')
  @ApiOperation({ summary: 'List Nigerian banks for transfers (ALAT NIP list)' })
  async transferBanks() {
    const data = await this.customerPortalService.getTransferBanks();
    return { success: true, data };
  }

  @Post('transfers/name-enquiry')
  @ApiOperation({ summary: 'Verify beneficiary account name before transfer (ALAT NIP)' })
  async transferNameEnquiry(@Body() dto: NameEnquiryDto) {
    const data = await this.customerPortalService.lookupTransferBeneficiary(dto);
    return { success: true, data };
  }

  @Post('transfer-requests')
  @ApiOperation({ summary: 'Submit a transfer request for manager approval' })
  async transferRequest(@User() user: CustomerJwtPayload, @Body() dto: CustomerTransferRequestDto) {
    const data = await this.customerPortalService.createTransferRequest(user.customerId, dto);
    return { success: true, data };
  }

  @Post('withdrawal-requests')
  @ApiOperation({ summary: 'Request My Pikin cash withdrawal after maturity (manager approval required)' })
  async withdrawalRequest(@User() user: CustomerJwtPayload, @Body() dto: CustomerWithdrawalRequestDto) {
    const data = await this.customerPortalService.createWithdrawalRequest(user.customerId, dto);
    return { success: true, data };
  }

  @Get('payment-requests')
  @ApiOperation({ summary: 'List customer payment requests' })
  async paymentRequests(
    @User() user: CustomerJwtPayload,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.customerPortalService.listPaymentRequests(
      user.customerId,
      Number(page) || 1,
      Number(limit) || 20,
    );
    return { success: true, ...result };
  }

  @Get('transactions')
  @ApiOperation({ summary: 'List customer transactions' })
  async transactions(
    @User() user: CustomerJwtPayload,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.customerPortalService.listTransactions(
      user.customerId,
      Number(page) || 1,
      Number(limit) || 20,
    );
    return { success: true, ...result };
  }

  @Get('notifications')
  @ApiOperation({ summary: 'List customer notifications' })
  async notifications(
    @User() user: CustomerJwtPayload,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.customerPortalService.listNotifications(
      user.customerId,
      Number(page) || 1,
      Number(limit) || 20,
    );
    return { success: true, ...result };
  }

  @Get('notifications/unread-count')
  @ApiOperation({ summary: 'Unread notification count' })
  async unreadCount(@User() user: CustomerJwtPayload) {
    const data = await this.customerPortalService.getUnreadNotificationCount(user.customerId);
    return { success: true, data };
  }

  @Patch('notifications/:id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markRead(@User() user: CustomerJwtPayload, @Param('id') id: string) {
    const data = await this.customerPortalService.markNotificationRead(user.customerId, id);
    return { success: true, data };
  }

  @Get('app-config')
  @ApiOperation({ summary: 'Public app configuration for mobile client' })
  async appConfig() {
    const data = this.customerPortalService.getAppConfig();
    return { success: true, data };
  }

  @Get('loan-products')
  @ApiOperation({ summary: 'List available loan products' })
  async loanProducts() {
    const data = await this.customerPortalService.listLoanProducts();
    return { success: true, data };
  }

  @Get('loans')
  @ApiOperation({ summary: 'List customer loans' })
  async loans(
    @User() user: CustomerJwtPayload,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.customerPortalService.listLoans(
      user.customerId,
      Number(page) || 1,
      Number(limit) || 20,
    );
    return { success: true, ...result };
  }

  @Post('loans/apply')
  @ApiOperation({ summary: 'Submit a loan application with collateral details and photo' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('collateralPhoto', {
      storage: collateralPhotoStorage,
      fileFilter: collateralPhotoFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async applyForLoan(
    @User() user: CustomerJwtPayload,
    @Body() dto: CustomerApplyLoanDto,
    @UploadedFile() collateralPhoto?: Express.Multer.File,
  ) {
    const photoUrl = collateralPhoto
      ? collateralPhotoPublicPath(collateralPhoto.filename)
      : undefined;
    const data = await this.customerPortalService.applyForLoan(
      user.customerId,
      dto,
      photoUrl,
    );
    return { success: true, data };
  }

  @Get('loans/:id')
  @ApiOperation({ summary: 'Get loan detail with repayment schedule' })
  async loanDetail(@User() user: CustomerJwtPayload, @Param('id') id: string) {
    const data = await this.customerPortalService.getLoan(user.customerId, id);
    return { success: true, data };
  }
}
