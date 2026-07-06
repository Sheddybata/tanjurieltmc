import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, AccountType } from '@tanjuriel/database';
import { IsEntityId } from '../../../common/validators/entity-id.decorator';

export class RegisterCustomerDto {
  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsString()
  lastName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiProperty()
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({ enum: Gender })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty()
  @IsString()
  phone: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bvn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nin?: string;

  @ApiProperty()
  @IsString()
  address: string;

  @ApiProperty()
  @IsString()
  city: string;

  @ApiProperty()
  @IsString()
  state: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  occupation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyIncome?: number;
}

export class OpenAccountDto {
  @ApiProperty()
  @IsEntityId()
  customerId: string;

  @ApiProperty({ enum: AccountType })
  @IsEnum(AccountType)
  type: AccountType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  initialDeposit?: number;

  @ApiPropertyOptional({ description: '4-6 digit PIN for mobile app access' })
  @IsOptional()
  @IsString()
  appPin?: string;

  @ApiPropertyOptional({ description: 'Child or account label (My Pikin)' })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({ description: 'Maturity date for My Pikin withdrawals (ISO date)' })
  @IsOptional()
  @IsDateString()
  maturityDate?: string;
}

export class EnableMobileAccessDto {
  @ApiProperty({ description: '4-6 digit PIN for mobile login' })
  @IsString()
  @IsNotEmpty()
  appPin: string;
}

export class LoanRepaymentDto {
  @ApiProperty()
  @IsEntityId()
  loanId: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  narration?: string;
}

export class TransactionDto {
  @ApiProperty()
  @IsEntityId()
  accountId: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  narration?: string;
}

export class CustomerSearchDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  limit?: number;
}
