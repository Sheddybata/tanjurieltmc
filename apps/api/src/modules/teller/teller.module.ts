import { Module } from '@nestjs/common';
import { TellerService } from './teller.service';
import { TellerController } from './teller.controller';
import { OperationsModule } from '../operations/operations.module';
import { ChildSavingsModule } from '../child-savings/child-savings.module';
import { LoansModule } from '../loans/loans.module';
import { ManagerModule } from '../manager/manager.module';

@Module({
  imports: [OperationsModule, ChildSavingsModule, LoansModule, ManagerModule],
  controllers: [TellerController],
  providers: [TellerService],
  exports: [TellerService],
})
export class TellerModule {}