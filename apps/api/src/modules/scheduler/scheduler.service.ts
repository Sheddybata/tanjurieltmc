import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LoanOverdueService } from '../loans/loan-overdue.service';
import { ReportingService } from '../reporting/reporting.service';
import { PrismaService } from '../../common/prisma/prisma.service';

// The business operates in Nigeria; schedule jobs in local time regardless of server timezone.
const TIME_ZONE = 'Africa/Lagos';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger('Scheduler');

  constructor(
    private readonly loanOverdue: LoanOverdueService,
    private readonly reporting: ReportingService,
    private readonly prisma: PrismaService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_6AM, { timeZone: TIME_ZONE })
  async handleOverdueLoans() {
    try {
      const result = await this.loanOverdue.syncOverdueLoans();
      this.logger.log(`Overdue sync complete: ${result.updated} loan(s) flagged`);
    } catch (err) {
      this.logger.error('Overdue loan sync failed', err as Error);
    }
  }

  @Cron('55 23 * * *', { timeZone: TIME_ZONE })
  async handleDailySnapshot() {
    try {
      await this.reporting.createDailySnapshot();
      this.logger.log('Daily snapshot saved');
    } catch (err) {
      this.logger.error('Daily snapshot failed', err as Error);
    }
  }

  @Cron(CronExpression.EVERY_WEEK, { timeZone: TIME_ZONE })
  async handleTokenCleanup() {
    try {
      const now = new Date();
      const [staff, customers] = await Promise.all([
        this.prisma.refreshToken.deleteMany({ where: { expiresAt: { lt: now } } }),
        this.prisma.customerRefreshToken.deleteMany({ where: { expiresAt: { lt: now } } }),
      ]);
      this.logger.log(`Token cleanup complete: removed ${staff.count + customers.count} expired token(s)`);
    } catch (err) {
      this.logger.error('Token cleanup failed', err as Error);
    }
  }
}
