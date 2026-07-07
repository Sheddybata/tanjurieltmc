import { ApiProperty, IntersectionType, OmitType } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';
import { CustomerProfileDto } from '../../../common/dto/customer-profile.dto';

export class CustomerLoginDto {
  @ApiProperty({ example: '08012345678' })
  @IsString()
  phone: string;

  @ApiProperty({ example: '1234' })
  @IsString()
  @Length(4, 6)
  @Matches(/^\d+$/)
  pin: string;
}

export class CustomerRegisterPinDto {
  @ApiProperty()
  @IsString()
  @Length(4, 6)
  @Matches(/^\d+$/)
  pin: string;
}

export class CustomerRegisterDto extends IntersectionType(
  OmitType(CustomerProfileDto, ['bvn', 'nin'] as const),
  CustomerRegisterPinDto,
) {
  @ApiProperty()
  @IsString()
  @Length(11, 11)
  @Matches(/^\d+$/)
  bvn: string;

  @ApiProperty()
  @IsString()
  @Length(11, 11)
  @Matches(/^\d+$/)
  nin: string;
}

export class CustomerChangePinDto {
  @ApiProperty()
  @IsString()
  @Length(4, 6)
  currentPin: string;

  @ApiProperty()
  @IsString()
  @Length(4, 6)
  newPin: string;
}
