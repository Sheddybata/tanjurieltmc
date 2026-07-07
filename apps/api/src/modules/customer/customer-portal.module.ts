import { Module } from '@nestjs/common';
import { CustomerPortalService } from './customer-portal.service';
import { CustomerPortalController } from './customer-portal.controller';
import { OperationsModule } from '../operations/operations.module';
import { CustomerAuthModule } from '../customer-auth/customer-auth.module';
import { AlatModule } from '../integrations/alat/alat.module';
import { ChildSavingsModule } from '../child-savings/child-savings.module';
import { LoansModule } from '../loans/loans.module';

@Module({
  imports: [OperationsModule, CustomerAuthModule, AlatModule, ChildSavingsModule, LoansModule],
  controllers: [CustomerPortalController],
  providers: [CustomerPortalService],
})
export class CustomerPortalModule {}
