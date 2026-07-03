import { Injectable } from '@nestjs/common';
import { SettlementProvider } from '@tanjuriel/database';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdateSettlementAccountDto } from './dto/settings.dto';

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
}
