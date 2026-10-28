import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient, resolvePrismaDatabaseUrl } from '@tanjuriel/database';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const url = resolvePrismaDatabaseUrl(process.env.DATABASE_URL);
    super({
      ...(url ? { datasources: { db: { url } } } : {}),
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      console.log('Database connected');
    } catch (error) {
      console.error(
        'Database connect failed on startup — check DATABASE_URL (use direct Postgres or pooler with connection_limit=1):',
        error,
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
