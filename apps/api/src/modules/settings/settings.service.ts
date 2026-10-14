import { BadRequestException, Injectable } from '@nestjs/common';
import { AccountType, SettlementProvider } from '@tanjuriel/database';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdateSettlementAccountDto } from './dto/settings.dto';
import {
  customersMissingPrimarySavingsWhere,
  ensurePrimarySavingsAccount,
  syncCustomerPaymentRefFromSavings,
} from '../../common/utils/primary-savings-account.util';
import { PLATFORM_SETTING_LOAN_FLAT_INTEREST_RATE } from '../../common/constants/platform-settings.constant';
import { LOAN_FLAT_INTEREST_RATE } from '../../common/utils/loan-pricing.util';
import {
  allLoansForBulkRepriceWhere,
  loanUsedLegacyFlatInterest,
  previewLoanInterestReprice,
  recalculateLoanWithFlatRate,
  repriceableLoansWhere,
} from '../../common/utils/loan-interest-recalculate.util';
import {
  RecalculateLoansInterestDto,
  RecalculateSingleLoanDto,
} from './dto/loan-pricing-settings.dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async listSettlementAccounts() {
    return this.prisma.settlementAccount.findMany({ orderBy: { provider: 'asc' } });
  }

  async updateSettlementAccount(provider: SettlementProvider, dto: UpdateSettlementAccountDto) {
    return this.prisma.settlementAccount.upsert({
      where: { provider },
      update: {
        bankName: dto.bankName,
        accountName: dto.accountName,
        accountNumber: dto.accountNumber,
        isActive: dto.isActive ?? true,
        instructions: dto.instructions,
      },
      create: {
        provider,
        bankName: dto.bankName,
        accountName: dto.accountName,
        accountNumber: dto.accountNumber,
        isActive: dto.isActive ?? true,
        instructions: dto.instructions,
      },
    });
  }

  async previewMissingPrimarySavingsAccounts() {
    const where = customersMissingPrimarySavingsWhere();
    const [total, sample] = await Promise.all([
      this.prisma.customer.count({ where }),
      this.prisma.customer.findMany({
        where,
        take: 10,
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          customerNumber: true,
          branchId: true,
        },
      }),
    ]);
    return { total, sample };
  }

  async backfillMissingPrimarySavingsAccounts(openedById: string) {
    if (!openedById) throw new BadRequestException('Actor is required');

    const customers = await this.prisma.customer.findMany({
      where: customersMissingPrimarySavingsWhere(),
      select: { id: true, branchId: true, firstName: true, lastName: true },
      orderBy: { createdAt: 'asc' },
    });

    const created: Array<{ customerId: string; name: string; accountNumber: string }> = [];
    const skipped: Array<{ customerId: string; name: string; accountNumber: string }> = [];
    const failed: Array<{ customerId: string; name: string; error: string }> = [];

    for (const customer of customers) {
      const name = `${customer.firstName} ${customer.lastName}`.trim();
      if (!customer.branchId) {
        failed.push({
          customerId: customer.id,
          name,
          error: 'Customer has no branch; assign a branch before opening an account',
        });
        continue;
      }

      try {
        const result = await this.prisma.$transaction((tx) =>
          ensurePrimarySavingsAccount(tx, {
            customerId: customer.id,
            branchId: customer.branchId!,
            openedById,
          }),
        );
        const row = { customerId: customer.id, name, accountNumber: result.accountNumber };
        if (result.created) created.push(row);
        else skipped.push(row);
      } catch (err) {
        failed.push({
          customerId: customer.id,
          name,
          error: err instanceof Error ? err.message : 'Could not create savings account',
        });
      }
    }

    const withSavings = await this.prisma.customer.findMany({
      where: { accounts: { some: { type: AccountType.SAVINGS } } },
      select: { id: true },
    });
    let paymentRefsSynced = 0;
    for (const { id } of withSavings) {
      if (await syncCustomerPaymentRefFromSavings(this.prisma, id)) paymentRefsSynced += 1;
    }

    return {
      scanned: customers.length,
      created: created.length,
      skipped: skipped.length,
      failed: failed.length,
      paymentRefsSynced,
      createdAccounts: created,
      skippedAccounts: skipped,
      failures: failed,
    };
  }

  async getLoanFlatInterestRate(): Promise<number> {
    try {
      const row = await this.prisma.platformSetting.findUnique({
        where: { key: PLATFORM_SETTING_LOAN_FLAT_INTEREST_RATE },
      });
      if (!row) return LOAN_FLAT_INTEREST_RATE;
      const parsed = Number(row.value);
      return Number.isFinite(parsed) ? parsed : LOAN_FLAT_INTEREST_RATE;
    } catch {
      return LOAN_FLAT_INTEREST_RATE;
    }
  }

  async setLoanFlatInterestRate(rate: number) {
    await this.prisma.platformSetting.upsert({
      where: { key: PLATFORM_SETTING_LOAN_FLAT_INTEREST_RATE },
      update: { value: String(rate) },
      create: { key: PLATFORM_SETTING_LOAN_FLAT_INTEREST_RATE, value: String(rate) },
    });
    return { flatInterestRate: rate };
  }

  async getLoanPricingConfig() {
    const flatInterestRate = await this.getLoanFlatInterestRate();
    return { flatInterestRate };
  }

  previewLoanInterestReprice(applyToAllLoans = false, targetRate?: number) {
    return this.getLoanFlatInterestRate().then((rate) =>
      previewLoanInterestReprice(this.prisma, targetRate ?? rate, applyToAllLoans),
    );
  }

  async recalculateLoansInterest(dto: RecalculateLoansInterestDto) {
    const targetRate = dto.flatInterestRate ?? (await this.getLoanFlatInterestRate());
    const where = dto.applyToAllLoans ? allLoansForBulkRepriceWhere() : repriceableLoansWhere();

    const loans = await this.prisma.loan.findMany({
      where,
      select: {
        id: true,
        loanNumber: true,
        principalAmount: true,
        flatInterestAmount: true,
        customer: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const updated: Array<{ loanNumber: string; name: string; newInterest: number }> = [];
    const skipped: Array<{ loanNumber: string; reason: string }> = [];
    const failed: Array<{ loanNumber: string; error: string }> = [];

    for (const loan of loans) {
      const principal = Number(loan.principalAmount);
      const flat = loan.flatInterestAmount != null ? Number(loan.flatInterestAmount) : null;
      if (!dto.force && !loanUsedLegacyFlatInterest(principal, flat, targetRate)) {
        skipped.push({ loanNumber: loan.loanNumber, reason: 'Already at target rate' });
        continue;
      }

      try {
        const quote = await this.prisma.$transaction((tx) =>
          recalculateLoanWithFlatRate(tx, loan.id, targetRate),
        );
        updated.push({
          loanNumber: loan.loanNumber,
          name: `${loan.customer.firstName} ${loan.customer.lastName}`.trim(),
          newInterest: quote.flatInterestAmount,
        });
      } catch (err) {
        failed.push({
          loanNumber: loan.loanNumber,
          error: err instanceof Error ? err.message : 'Could not recalculate',
        });
      }
    }

    return {
      flatInterestRate: targetRate,
      applyToAllLoans: Boolean(dto.applyToAllLoans),
      scanned: loans.length,
      updated: updated.length,
      skipped: skipped.length,
      failed: failed.length,
      updatedLoans: updated,
      skippedLoans: skipped.slice(0, 20),
      failures: failed,
    };
  }

  async recalculateSingleLoanInterest(dto: RecalculateSingleLoanDto) {
    if (!dto.loanId && !dto.loanNumber?.trim()) {
      throw new BadRequestException('Provide loanId or loanNumber');
    }

    const loan = await this.prisma.loan.findFirst({
      where: dto.loanId
        ? { id: dto.loanId }
        : { loanNumber: dto.loanNumber!.trim() },
      select: {
        id: true,
        loanNumber: true,
        status: true,
        principalAmount: true,
        flatInterestAmount: true,
        tenurePeriods: true,
        repaymentPlan: true,
        customer: { select: { firstName: true, lastName: true } },
      },
    });
    if (!loan) throw new BadRequestException('Loan not found');
    if (!loan.tenurePeriods || !loan.repaymentPlan) {
      throw new BadRequestException('Loan cannot be repriced (missing tenure or repayment plan)');
    }

    const quote = await this.prisma.$transaction((tx) =>
      recalculateLoanWithFlatRate(tx, loan.id, dto.flatInterestRate),
    );

    return {
      loanNumber: loan.loanNumber,
      status: loan.status,
      customerName: `${loan.customer.firstName} ${loan.customer.lastName}`.trim(),
      flatInterestRate: dto.flatInterestRate,
      flatInterestAmount: quote.flatInterestAmount,
      totalRepayable: quote.totalRepayable,
      installmentAmount: quote.installmentAmount,
    };
  }
}
