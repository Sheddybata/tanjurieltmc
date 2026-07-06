import { Module } from '@nestjs/common';
import { AlatService } from './alat.service';

@Module({
  providers: [AlatService],
  exports: [AlatService],
})
export class AlatModule {}
