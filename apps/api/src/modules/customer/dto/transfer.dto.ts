import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class NameEnquiryDto {
  @ApiProperty({ example: '000013', description: 'NIP bank code from GET /customer/transfers/banks' })
  @IsString()
  @Length(3, 10)
  bankCode: string;

  @ApiProperty({ example: '0123456789' })
  @IsString()
  @Length(10, 10)
  @Matches(/^\d{10}$/, { message: 'Account number must be 10 digits' })
  accountNumber: string;
}
