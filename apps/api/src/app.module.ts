import { join } from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TellerModule } from './modules/teller/teller.module';
import { ManagerModule } from './modules/manager/manager.module';
import { ReportingModule } from './modules/reporting/reporting.module';
import { AuditModule } from './modules/audit/audit.module';
import { OperationsModule } from './modules/operations/operations.module';
import { CustomerAuthModule } from './modules/customer-auth/customer-auth.module';
import { CustomerPortalModule } from './modules/customer/customer-portal.module';
import { SettingsModule } from './modules/settings/settings.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [join(__dirname, '../../../.env'), join(__dirname, '../../../.env.local')],
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    TellerModule,
    ManagerModule,
    ReportingModule,
    AuditModule,
    OperationsModule,
    CustomerAuthModule,
    CustomerPortalModule,
    SettingsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
