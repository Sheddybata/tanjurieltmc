import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { LoanApplicationService } from './loan-application.service';
import { LoanOverdueService } from './loan-overdue.service';

@Module({
  imports: [SettingsModule],
  providers: [LoanApplicationService, LoanOverdueService],
  exports: [LoanApplicationService, LoanOverdueService],
})
export class LoansModule {}
