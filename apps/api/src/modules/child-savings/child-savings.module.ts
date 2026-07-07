import { Module } from '@nestjs/common';
import { ChildSavingsStatementService } from './child-savings-statement.service';

@Module({
  providers: [ChildSavingsStatementService],
  exports: [ChildSavingsStatementService],
})
export class ChildSavingsModule {}
