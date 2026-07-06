import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  AccountStatus,
  AccountType,
  ApprovalAction,
  LoanStatus,
  PaymentChannel,
  PaymentRequestStatus,
  PaymentRequestType,
  SettlementProvider,
  TransactionStatus,
  TransactionType,
} from '@tanjuriel/database';
import { JwtPayload } from '@tanjuriel/shared';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  generatePaymentRequestRef,
  generateTransactionRef,
  paginate,
  paginationMeta,
} from '../../common/utils/reference.util';
import { normalizeMoneyAmount, toMoneyDecimalString } from '../../common/utils/money.util';

export interface CreateDepositRequestInput {
  accountId: string;
  amount: number;
  channel: PaymentChannel;
  settlementProvider?: SettlementProvider;
  customerNote?: string;
  narration?: string;
  initiatedByStaffId?: string;
  customerId?: string;
}

export interface CreateWithdrawalRequestInput {
  accountId: string;
  amount: number;
  channel: PaymentChannel;
  narration?: string;
  initiatedByStaffId?: string;
  customerId?: string;
}

export interface CreateTransferRequestInput {
  accountId: string;
  amount: number;
  beneficiaryBank: string;
  beneficiaryAccount: string;
  beneficiaryName: string;
  narration?: string;
  customerId: string;
}

export interface CreateLoanRepaymentRequestInput {
  loanId: string;
  accountId: string;
  amount: number;
  customerId: string;
  initiatedByStaffId: string;
  narration?: string;
}

@Injectable()
export class OperationsService {
  constructor(private prisma: PrismaService) {}

  async createDepositRequest(input: CreateDepositRequestInput) {
    const account = await this.getActiveAccount(input.accountId);
    const amount = normalizeMoneyAmount(input.amount);

    if (input.channel === PaymentChannel.BANK_TRANSFER && !input.settlementProvider) {
      throw new BadRequestException('Settlement provider is required for bank transfer deposits');
    }

    const request = await this.prisma.paymentRequest.create({
      data: {
        reference: generatePaymentRequestRef(),
        type: PaymentRequestType.DEPOSIT,
        status: PaymentRequestStatus.PENDING,
        amount: toMoneyDecimalString(amount),
        channel: input.channel,
        accountId: input.accountId,
        customerId: input.customerId ?? account.customerId,
        initiatedByStaffId: input.initiatedByStaffId,
        settlementProvider: input.settlementProvider,
        customerNote: input.customerNote,
        narration: input.narration || 'Deposit request',
      },
      include: this.requestIncludes(),
    });

    await this.notifyCustomer(
      request.customerId!,
      'Deposit submitted',
      `Your deposit request of ₦${amount.toLocaleString()} is pending manager approval.`,
      'deposit_pending',
      'PaymentRequest',
      request.id,
    );

    await this.notifyManagers(
      'New deposit to approve',
      `${request.account.customer.firstName} ${request.account.customer.lastName} submitted a deposit of ₦${amount.toLocaleString()}.`,
      'deposit_pending',
      request.id,
    );

    return request;
  }

  async createWithdrawalRequest(input: CreateWithdrawalRequestInput) {
    const amount = normalizeMoneyAmount(input.amount);
    const account = await this.getActiveAccount(input.accountId);
    this.ensureAvailableBalance(account, amount);

    const request = await this.prisma.$transaction(async (tx) => {
      await this.holdFunds(tx, input.accountId, amount);

      return tx.paymentRequest.create({
        data: {
          reference: generatePaymentRequestRef(),
          type: PaymentRequestType.WITHDRAWAL,
          status: PaymentRequestStatus.PENDING,
          amount: toMoneyDecimalString(amount),
          channel: input.channel,
          accountId: input.accountId,
          customerId: input.customerId ?? account.customerId,
          initiatedByStaffId: input.initiatedByStaffId,
          narration: input.narration || 'Withdrawal request',
        },
        include: this.requestIncludes(),
      });
    });

    await this.notifyCustomer(
      request.customerId!,
      'Withdrawal submitted',
      `Your withdrawal request of ₦${amount.toLocaleString()} is pending manager approval.`,
      'withdrawal_pending',
      'PaymentRequest',
      request.id,
    );

    await this.notifyManagers(
      'New withdrawal to approve',
      `${request.account.customer.firstName} ${request.account.customer.lastName} requested a withdrawal of ₦${amount.toLocaleString()}.`,
      'withdrawal_pending',
      request.id,
    );

    return request;
  }

  async createTransferRequest(input: CreateTransferRequestInput) {
    const amount = normalizeMoneyAmount(input.amount);
    const account = await this.getActiveAccount(input.accountId);

    if (account.customerId !== input.customerId) {
      throw new ForbiddenException('Account does not belong to customer');
    }

    this.ensureAvailableBalance(account, amount);

    const request = await this.prisma.$transaction(async (tx) => {
      await this.holdFunds(tx, input.accountId, amount);

      return tx.paymentRequest.create({
        data: {
          reference: generatePaymentRequestRef(),
          type: PaymentRequestType.TRANSFER,
          status: PaymentRequestStatus.PENDING,
          amount: toMoneyDecimalString(amount),
          channel: PaymentChannel.MOBILE,
          accountId: input.accountId,
          customerId: input.customerId,
          beneficiaryBank: input.beneficiaryBank,
          beneficiaryAccount: input.beneficiaryAccount,
          beneficiaryName: input.beneficiaryName,
          narration: input.narration || 'Transfer request',
        },
        include: this.requestIncludes(),
      });
    });

    await this.notifyCustomer(
      input.customerId,
      'Transfer submitted',
      `Your transfer of ₦${amount.toLocaleString()} to ${input.beneficiaryName} is pending approval.`,
      'transfer_pending',
      'PaymentRequest',
      request.id,
    );

    await this.notifyManagers(
      'New transfer to approve',
      `${request.account.customer.firstName} ${request.account.customer.lastName} requested a transfer of ₦${amount.toLocaleString()}.`,
      'transfer_pending',
      request.id,
    );

    return request;
  }

  async createLoanRepaymentRequest(input: CreateLoanRepaymentRequestInput) {
    const amount = normalizeMoneyAmount(input.amount);
    const loan = await this.prisma.loan.findUnique({
      where: { id: input.loanId },
      include: { customer: true },
    });

    if (!loan) throw new NotFoundException('Loan not found');
    if (!([LoanStatus.DISBURSED, LoanStatus.ACTIVE, LoanStatus.OVERDUE] as LoanStatus[]).includes(loan.status)) {
      throw new BadRequestException('Loan is not active for repayment');
    }
    if (amount > Number(loan.outstandingBalance)) {
      throw new BadRequestException('Repayment amount exceeds outstanding balance');
    }

    const account = await this.getActiveAccount(input.accountId);
    if (account.customerId !== loan.customerId) {
      throw new BadRequestException('Account does not belong to loan customer');
    }

    const request = await this.prisma.paymentRequest.create({
      data: {
        reference: generatePaymentRequestRef(),
        type: PaymentRequestType.LOAN_REPAYMENT,
        status: PaymentRequestStatus.PENDING,
        amount: toMoneyDecimalString(amount),
        channel: PaymentChannel.CASH,
        accountId: input.accountId,
        customerId: input.customerId,
        loanId: input.loanId,
        initiatedByStaffId: input.initiatedByStaffId,
        narration: input.narration || `Loan repayment - ${loan.loanNumber}`,
      },
      include: this.requestIncludes(),
    });

    await this.notifyCustomer(
      input.customerId,
      'Loan repayment submitted',
      `Your cash loan repayment of ₦${amount.toLocaleString()} is pending manager approval.`,
      'loan_repayment_pending',
      'PaymentRequest',
      request.id,
    );

    await this.notifyManagers(
      'Loan repayment to approve',
      `${loan.customer.firstName} ${loan.customer.lastName} paid ₦${amount.toLocaleString()} toward loan ${loan.loanNumber}.`,
      'loan_repayment_pending',
      request.id,
    );

    return request;
  }

  async listPending(type?: PaymentRequestType, page = 1, limit = 20) {
    const { skip, take, page: p, limit: l } = paginate(page, limit);

    const where = {
      status: PaymentRequestStatus.PENDING,
      ...(type ? { type } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.paymentRequest.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'asc' },
        include: this.requestIncludes(),
      }),
      this.prisma.paymentRequest.count({ where }),
    ]);

    return { data, meta: paginationMeta(total, p, l) };
  }

  async getRequest(id: string) {
    const request = await this.prisma.paymentRequest.findUnique({
      where: { id },
      include: {
        ...this.requestIncludes(),
        approvals: {
          include: { actor: { select: { firstName: true, lastName: true, role: true } } },
          orderBy: { createdAt: 'desc' },
        },
        transaction: true,
      },
    });

    if (!request) throw new NotFoundException('Payment request not found');
    return request;
  }

  async approveRequest(
    id: string,
    actor: JwtPayload,
    comment?: string,
    externalBankRef?: string,
  ) {
    const request = await this.getRequest(id);

    if (request.status !== PaymentRequestStatus.PENDING) {
      throw new BadRequestException('Request is not pending approval');
    }

    if (request.type === PaymentRequestType.DEPOSIT) {
      return this.approveDeposit(request, actor, comment, externalBankRef);
    }

    if (request.type === PaymentRequestType.WITHDRAWAL) {
      return this.approveWithdrawal(request, actor, comment, externalBankRef);
    }

    if (request.type === PaymentRequestType.TRANSFER) {
      return this.approveTransfer(request, actor, comment, externalBankRef);
    }

    if (request.type === PaymentRequestType.LOAN_REPAYMENT) {
      return this.approveLoanRepayment(request, actor, comment);
    }

    throw new BadRequestException('Unsupported request type');
  }

  async rejectRequest(id: string, actor: JwtPayload, comment?: string) {
    const request = await this.getRequest(id);

    if (request.status !== PaymentRequestStatus.PENDING) {
      throw new BadRequestException('Request is not pending approval');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (
        request.type !== PaymentRequestType.DEPOSIT &&
        request.type !== PaymentRequestType.LOAN_REPAYMENT
      ) {
        await this.releaseHold(tx, request.accountId, Number(request.amount));
      }

      await tx.paymentRequestApproval.create({
        data: {
          paymentRequestId: id,
          actorId: actor.sub,
          action: ApprovalAction.REJECT,
          comment,
        },
      });

      return tx.paymentRequest.update({
        where: { id },
        data: { status: PaymentRequestStatus.REJECTED },
        include: this.requestIncludes(),
      });
    });

    await this.notifyCustomer(
      request.customerId!,
      'Request declined',
      `Your ${request.type.toLowerCase()} request of ₦${Number(request.amount).toLocaleString()} was declined.${comment ? ` Reason: ${comment}` : ''}`,
      `${request.type.toLowerCase()}_rejected`,
      'PaymentRequest',
      request.id,
    );

    return updated;
  }

  async getReconciliation() {
    const [balanceAgg, pendingDeposits, pendingOutbound] = await Promise.all([
      this.prisma.account.aggregate({
        where: { status: AccountStatus.ACTIVE },
        _sum: { balance: true, heldBalance: true },
      }),
      this.prisma.paymentRequest.aggregate({
        where: { type: PaymentRequestType.DEPOSIT, status: PaymentRequestStatus.PENDING },
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.paymentRequest.aggregate({
        where: {
          type: { in: [PaymentRequestType.WITHDRAWAL, PaymentRequestType.TRANSFER] },
          status: PaymentRequestStatus.PENDING,
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    const settlementAccounts = await this.prisma.settlementAccount.findMany({
      where: { isActive: true },
      orderBy: { provider: 'asc' },
    });

    return {
      totalCustomerBalances: Number(balanceAgg._sum.balance || 0),
      totalHeldBalances: Number(balanceAgg._sum.heldBalance || 0),
      pendingDepositCount: pendingDeposits._count.id,
      pendingDepositAmount: Number(pendingDeposits._sum.amount || 0),
      pendingOutboundCount: pendingOutbound._count.id,
      pendingOutboundAmount: Number(pendingOutbound._sum.amount || 0),
      settlementAccounts,
      note: 'Compare total customer balances against actual funds in your Zenith, Opay, and Moniepoint accounts.',
    };
  }

  private async approveDeposit(
    request: Awaited<ReturnType<OperationsService['getRequest']>>,
    actor: JwtPayload,
    comment?: string,
    externalBankRef?: string,
  ) {
    const amount = normalizeMoneyAmount(request.amount);

    return this.prisma.$transaction(async (tx) => {
      const account = await tx.account.findUnique({ where: { id: request.accountId } });
      if (!account) throw new NotFoundException('Account not found');

      const balanceBefore = Number(account.balance);
      const balanceAfter = balanceBefore + amount;
      const held = Number(account.heldBalance);

      const transaction = await tx.transaction.create({
        data: {
          reference: generateTransactionRef(),
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.COMPLETED,
          amount: toMoneyDecimalString(amount),
          balanceBefore,
          balanceAfter,
          narration: request.narration || 'Approved deposit',
          accountId: request.accountId,
          processedById: actor.sub,
          externalBankRef,
          paymentRequestId: request.id,
        },
      });

      await tx.account.update({
        where: { id: request.accountId },
        data: {
          balance: balanceAfter,
          availableBalance: balanceAfter - held,
          status: account.status === AccountStatus.PENDING ? AccountStatus.ACTIVE : account.status,
        },
      });

      await tx.paymentRequestApproval.create({
        data: {
          paymentRequestId: request.id,
          actorId: actor.sub,
          action: ApprovalAction.APPROVE,
          comment,
          externalBankRef,
        },
      });

      const updated = await tx.paymentRequest.update({
        where: { id: request.id },
        data: {
          status: PaymentRequestStatus.APPROVED,
          externalBankRef,
        },
        include: this.requestIncludes(),
      });

      await this.notifyCustomerTx(
        tx,
        request.customerId!,
        'Deposit approved',
        `₦${amount.toLocaleString()} has been credited to your account.`,
        'deposit_approved',
        'PaymentRequest',
        request.id,
      );

      return { request: updated, transaction };
    });
  }

  private async approveWithdrawal(
    request: Awaited<ReturnType<OperationsService['getRequest']>>,
    actor: JwtPayload,
    comment?: string,
    externalBankRef?: string,
  ) {
    const account = await this.prisma.account.findUnique({ where: { id: request.accountId } });
    if (account?.type === AccountType.MY_PIKIN) {
      if (account.maturityDate && account.maturityDate > new Date()) {
        throw new BadRequestException(
          `My Pikin account has not reached maturity (${account.maturityDate.toISOString().slice(0, 10)}).`,
        );
      }
    }

    const isCash = request.channel === PaymentChannel.CASH;
    if (!isCash && !externalBankRef) {
      throw new BadRequestException('External bank reference is required for withdrawals');
    }

    return this.completeOutbound(
      request,
      actor,
      TransactionType.WITHDRAWAL,
      comment,
      externalBankRef || (isCash ? 'CASH' : undefined),
    );
  }

  private async approveLoanRepayment(
    request: Awaited<ReturnType<OperationsService['getRequest']>>,
    actor: JwtPayload,
    comment?: string,
  ) {
    if (!request.loanId) {
      throw new BadRequestException('Loan repayment request is missing loan reference');
    }

    const amount = normalizeMoneyAmount(request.amount);

    return this.prisma.$transaction(async (tx) => {
      const loan = await tx.loan.findUnique({
        where: { id: request.loanId! },
        include: {
          schedules: { where: { isPaid: false }, orderBy: { installmentNumber: 'asc' } },
        },
      });
      if (!loan) throw new NotFoundException('Loan not found');

      const account = await tx.account.findUnique({ where: { id: request.accountId } });
      if (!account) throw new NotFoundException('Account not found');

      const balanceBefore = Number(account.balance);
      const balanceAfter = balanceBefore;

      await this.applyLoanPayment(tx, loan.id, amount);

      const transaction = await tx.transaction.create({
        data: {
          reference: generateTransactionRef(),
          type: TransactionType.LOAN_REPAYMENT,
          status: TransactionStatus.COMPLETED,
          amount: toMoneyDecimalString(amount),
          balanceBefore,
          balanceAfter,
          narration: request.narration || `Loan repayment - ${loan.loanNumber}`,
          accountId: request.accountId,
          processedById: actor.sub,
          paymentRequestId: request.id,
          metadata: { loanId: loan.id, loanNumber: loan.loanNumber },
        },
      });

      await tx.paymentRequestApproval.create({
        data: {
          paymentRequestId: request.id,
          actorId: actor.sub,
          action: ApprovalAction.APPROVE,
          comment,
        },
      });

      const updated = await tx.paymentRequest.update({
        where: { id: request.id },
        data: { status: PaymentRequestStatus.APPROVED },
        include: this.requestIncludes(),
      });

      await this.notifyCustomerTx(
        tx,
        request.customerId!,
        'Loan repayment recorded',
        `₦${amount.toLocaleString()} has been applied to loan ${loan.loanNumber}.`,
        'loan_repayment_approved',
        'PaymentRequest',
        request.id,
      );

      return { request: updated, transaction };
    });
  }

  private async applyLoanPayment(
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    loanId: string,
    amount: number,
  ) {
    const loan = await tx.loan.findUnique({
      where: { id: loanId },
      include: {
        schedules: { where: { isPaid: false }, orderBy: { installmentNumber: 'asc' } },
      },
    });
    if (!loan) throw new NotFoundException('Loan not found');

    let remaining = amount;
    for (const schedule of loan.schedules) {
      if (remaining <= 0) break;
      const due = Number(schedule.totalDue) - Number(schedule.paidAmount);
      const pay = Math.min(remaining, due);
      const newPaid = Number(schedule.paidAmount) + pay;
      const isPaid = newPaid >= Number(schedule.totalDue);

      await tx.loanSchedule.update({
        where: { id: schedule.id },
        data: {
          paidAmount: newPaid,
          isPaid,
          paidAt: isPaid ? new Date() : schedule.paidAt,
        },
      });
      remaining -= pay;
    }

    const newOutstanding = Math.max(0, Number(loan.outstandingBalance) - amount);
    const closed = newOutstanding <= 0;

    await tx.loan.update({
      where: { id: loanId },
      data: {
        outstandingBalance: newOutstanding,
        status: closed
          ? LoanStatus.CLOSED
          : loan.status === LoanStatus.DISBURSED
            ? LoanStatus.ACTIVE
            : loan.status,
        closedAt: closed ? new Date() : loan.closedAt,
      },
    });
  }

  private async approveTransfer(
    request: Awaited<ReturnType<OperationsService['getRequest']>>,
    actor: JwtPayload,
    comment?: string,
    externalBankRef?: string,
  ) {
    if (!externalBankRef) {
      throw new BadRequestException('External bank reference is required for transfers');
    }

    return this.completeOutbound(request, actor, TransactionType.TRANSFER, comment, externalBankRef);
  }

  private async completeOutbound(
    request: Awaited<ReturnType<OperationsService['getRequest']>>,
    actor: JwtPayload,
    type: TransactionType,
    comment?: string,
    externalBankRef?: string,
  ) {
    const amount = normalizeMoneyAmount(request.amount);

    return this.prisma.$transaction(async (tx) => {
      const account = await tx.account.findUnique({ where: { id: request.accountId } });
      if (!account) throw new NotFoundException('Account not found');

      const balanceBefore = Number(account.balance);
      const held = Number(account.heldBalance);

      if (balanceBefore < amount) {
        throw new BadRequestException('Insufficient balance');
      }

      const balanceAfter = balanceBefore - amount;
      const heldAfter = Math.max(0, held - amount);

      const transaction = await tx.transaction.create({
        data: {
          reference: generateTransactionRef(),
          type,
          status: TransactionStatus.COMPLETED,
          amount: toMoneyDecimalString(amount),
          balanceBefore,
          balanceAfter,
          narration: request.narration || `Approved ${type.toLowerCase()}`,
          accountId: request.accountId,
          processedById: actor.sub,
          externalBankRef,
          counterpartyRef: request.beneficiaryAccount || undefined,
          paymentRequestId: request.id,
          metadata: request.beneficiaryBank
            ? {
                beneficiaryBank: request.beneficiaryBank,
                beneficiaryAccount: request.beneficiaryAccount,
                beneficiaryName: request.beneficiaryName,
              }
            : undefined,
        },
      });

      await tx.account.update({
        where: { id: request.accountId },
        data: {
          balance: balanceAfter,
          heldBalance: heldAfter,
          availableBalance: balanceAfter - heldAfter,
        },
      });

      await tx.paymentRequestApproval.create({
        data: {
          paymentRequestId: request.id,
          actorId: actor.sub,
          action: ApprovalAction.APPROVE,
          comment,
          externalBankRef,
        },
      });

      const updated = await tx.paymentRequest.update({
        where: { id: request.id },
        data: {
          status: PaymentRequestStatus.APPROVED,
          externalBankRef,
        },
        include: this.requestIncludes(),
      });

      const title = type === TransactionType.TRANSFER ? 'Transfer completed' : 'Withdrawal completed';
      const body =
        type === TransactionType.TRANSFER
          ? `₦${amount.toLocaleString()} has been sent to ${request.beneficiaryName}.`
          : `₦${amount.toLocaleString()} withdrawal has been processed.`;

      await this.notifyCustomerTx(
        tx,
        request.customerId!,
        title,
        body,
        `${type.toLowerCase()}_approved`,
        'PaymentRequest',
        request.id,
      );

      return { request: updated, transaction };
    });
  }

  private async getActiveAccount(accountId: string) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: { customer: true },
    });

    if (!account) throw new NotFoundException('Account not found');
    if (account.status !== AccountStatus.ACTIVE && account.status !== AccountStatus.PENDING) {
      throw new BadRequestException('Account is not active');
    }

    return account;
  }

  private ensureAvailableBalance(
    account: { balance: unknown; heldBalance: unknown },
    amount: number,
  ) {
    const available = Number(account.balance) - Number(account.heldBalance);
    if (available < amount) {
      throw new BadRequestException('Insufficient available balance');
    }
  }

  private async holdFunds(
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    accountId: string,
    amount: number,
  ) {
    const account = await tx.account.findUnique({ where: { id: accountId } });
    if (!account) throw new NotFoundException('Account not found');

    const available = Number(account.balance) - Number(account.heldBalance);
    if (available < amount) {
      throw new BadRequestException('Insufficient available balance');
    }

    const heldAfter = Number(account.heldBalance) + amount;
    await tx.account.update({
      where: { id: accountId },
      data: {
        heldBalance: heldAfter,
        availableBalance: Number(account.balance) - heldAfter,
      },
    });
  }

  private async releaseHold(
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    accountId: string,
    amount: number,
  ) {
    const account = await tx.account.findUnique({ where: { id: accountId } });
    if (!account) throw new NotFoundException('Account not found');

    const heldAfter = Math.max(0, Number(account.heldBalance) - amount);
    await tx.account.update({
      where: { id: accountId },
      data: {
        heldBalance: heldAfter,
        availableBalance: Number(account.balance) - heldAfter,
      },
    });
  }

  private requestIncludes() {
    return {
      account: {
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              customerNumber: true,
              paymentRef: true,
            },
          },
        },
      },
      loan: { select: { id: true, loanNumber: true, outstandingBalance: true, status: true } },
      initiatedBy: { select: { id: true, firstName: true, lastName: true, role: true } },
    } as const;
  }

  private async notifyCustomer(
    customerId: string,
    title: string,
    body: string,
    type: string,
    entityType?: string,
    entityId?: string,
  ) {
    await this.prisma.notification.create({
      data: { customerId, title, body, type, entityType, entityId },
    });
  }

  private async notifyCustomerTx(
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    customerId: string,
    title: string,
    body: string,
    type: string,
    entityType?: string,
    entityId?: string,
  ) {
    await tx.notification.create({
      data: { customerId, title, body, type, entityType, entityId },
    });
  }

  private async notifyManagers(title: string, body: string, type: string, entityId: string) {
    const managers = await this.prisma.user.findMany({
      where: { role: { in: ['MANAGER', 'ADMIN'] }, status: 'ACTIVE' },
      select: { id: true },
    });

    if (!managers.length) return;

    await this.prisma.notification.createMany({
      data: managers.map((m) => ({
        userId: m.id,
        title,
        body,
        type,
        entityType: 'PaymentRequest',
        entityId,
      })),
    });
  }
}
