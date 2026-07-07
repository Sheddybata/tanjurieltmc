import { Module } from '@nestjs/common';
import { LoansModule } from '../loans/loans.module';
import { ReportingModule } from '../reporting/reporting.module';
import { SchedulerService } from './scheduler.service';

@Module({
  imports: [LoansModule, ReportingModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
