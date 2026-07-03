import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentRequestType } from '@tanjuriel/database';
import { JwtPayload, Permission } from '@tanjuriel/shared';
import { Permissions, User } from '../../common/decorators/auth.decorators';
import { JwtAuthGuard, PermissionsGuard, StaffGuard } from '../../common/guards/auth.guards';
import { OperationsService } from './operations.service';
import { ApproveRequestDto, ListPendingDto, RejectRequestDto } from './dto/operations.dto';

@ApiTags('Operations')
@Controller('operations')
@UseGuards(JwtAuthGuard, StaffGuard, PermissionsGuard)
@ApiBearerAuth()
export class OperationsController {
  constructor(private operationsService: OperationsService) {}

  @Get('pending')
  @Permissions(Permission.VIEW_PENDING_REQUESTS)
  @ApiOperation({ summary: 'List pending payment requests' })
  async listPending(@Query() query: ListPendingDto) {
    const result = await this.operationsService.listPending(
      query.type,
      Number(query.page) || 1,
      Number(query.limit) || 20,
    );
    return { success: true, ...result };
  }

  @Get('pending/deposits')
  @Permissions(Permission.VIEW_PENDING_REQUESTS)
  @ApiOperation({ summary: 'List pending deposit requests' })
  async listPendingDeposits(@Query('page') page?: number, @Query('limit') limit?: number) {
    const result = await this.operationsService.listPending(
      PaymentRequestType.DEPOSIT,
      Number(page) || 1,
      Number(limit) || 20,
    );
    return { success: true, ...result };
  }

  @Get('pending/transfers')
  @Permissions(Permission.VIEW_PENDING_REQUESTS)
  @ApiOperation({ summary: 'List pending transfer and withdrawal requests' })
  async listPendingTransfers(@Query('page') page?: number, @Query('limit') limit?: number) {
    const [withdrawals, transfers] = await Promise.all([
      this.operationsService.listPending(PaymentRequestType.WITHDRAWAL, 1, 100),
      this.operationsService.listPending(PaymentRequestType.TRANSFER, 1, 100),
    ]);

    const data = [...withdrawals.data, ...transfers.data].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );

    return { success: true, data, meta: { total: data.length } };
  }

  @Get('reconciliation')
  @Permissions(Permission.VIEW_RECONCILIATION)
  @ApiOperation({ summary: 'Reconciliation summary' })
  async reconciliation() {
    const data = await this.operationsService.getReconciliation();
    return { success: true, data };
  }

  @Get(':id')
  @Permissions(Permission.VIEW_PENDING_REQUESTS)
  @ApiOperation({ summary: 'Get payment request details' })
  async getRequest(@Param('id') id: string) {
    const data = await this.operationsService.getRequest(id);
    return { success: true, data };
  }

  @Post(':id/approve')
  @Permissions(Permission.APPROVE_PAYMENT_REQUEST)
  @ApiOperation({ summary: 'Approve a pending payment request' })
  async approve(@Param('id') id: string, @Body() dto: ApproveRequestDto, @User() user: JwtPayload) {
    const data = await this.operationsService.approveRequest(
      id,
      user,
      dto.comment,
      dto.externalBankRef,
    );
    return { success: true, data };
  }

  @Post(':id/reject')
  @Permissions(Permission.APPROVE_PAYMENT_REQUEST)
  @ApiOperation({ summary: 'Reject a pending payment request' })
  async reject(@Param('id') id: string, @Body() dto: RejectRequestDto, @User() user: JwtPayload) {
    const data = await this.operationsService.rejectRequest(id, user, dto.comment);
    return { success: true, data };
  }
}
