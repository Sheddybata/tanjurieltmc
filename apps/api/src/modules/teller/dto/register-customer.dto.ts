import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { AccountOfficer } from '@tanjuriel/database';
import { CustomerProfileDto } from '../../../common/dto/customer-profile.dto';
import { CustomerRegisterPinDto } from '../../customer-auth/dto/customer-auth.dto';

export class RegisterCustomerDto extends IntersectionType(
  CustomerProfileDto,
  CustomerRegisterPinDto,
) {
  @ApiPropertyOptional({ enum: AccountOfficer, description: 'Account officer for this member' })
  @IsOptional()
  @IsEnum(AccountOfficer)
  accountOfficer?: AccountOfficer;
}
