import { Module } from '@nestjs/common';
import { TellerService } from './teller.service';
import { TellerController } from './teller.controller';
import { OperationsModule } from '../operations/operations.module';

@Module({
  imports: [OperationsModule],
  controllers: [TellerController],
  providers: [TellerService],
  exports: [TellerService],
})
export class TellerModule {}