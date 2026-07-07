import { Module } from '@nestjs/common';
import { TellerService } from './teller.service';
import { TellerController } from './teller.controller';
import { OperationsModule } from '../operations/operations.module';
import { ChildSavingsModule } from '../child-savings/child-savings.module';

@Module({
  imports: [OperationsModule, ChildSavingsModule],
  controllers: [TellerController],
  providers: [TellerService],
  exports: [TellerService],
})
export class TellerModule {}