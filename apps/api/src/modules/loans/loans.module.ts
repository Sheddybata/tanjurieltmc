import { Module } from '@nestjs/common';
import { LoanApplicationService } from './loan-application.service';
import { LoanOverdueService } from './loan-overdue.service';

@Module({
  providers: [LoanApplicationService, LoanOverdueService],
  exports: [LoanApplicationService, LoanOverdueService],
})
export class LoansModule {}
