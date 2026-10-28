import { Module } from '@nestjs/common';
import { AccountOfficerPortalController } from './account-officer-portal.controller';
import { AccountOfficerPortalService } from './account-officer-portal.service';

@Module({
  controllers: [AccountOfficerPortalController],
  providers: [AccountOfficerPortalService],
})
export class AccountOfficerModule {}
