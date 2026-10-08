import { BadRequestException, Injectable } from '@nestjs/common';
import { AccountType, SettlementProvider } from '@tanjuriel/database';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdateSettlementAccountDto } from './dto/settings.dto';
import {
  customersMissingPrimarySavingsWhere,
  ensurePrimarySavingsAccount,
  syncCustomerPaymentRefFromSavings,
} from '../../common/utils/primary-savings-account.util';

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
}
