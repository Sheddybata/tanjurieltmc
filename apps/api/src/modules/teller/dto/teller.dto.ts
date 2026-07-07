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
import { Gender, AccountType, ContributionFrequency } from '@tanjuriel/database';
import { IsEntityId } from '../../../common/validators/entity-id.decorator';
import { IsMoneyAmount, TransformMoney } from '../../../common/validators/money.decorator';

export { RegisterCustomerDto } from './register-customer.dto';

export class OpenAccountDto {
  @ApiProperty()
  @IsEntityId()
  customerId: string;

  @ApiProperty({ enum: AccountType })
  @IsEnum(AccountType)
  type: AccountType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMoneyAmount()
  @TransformMoney()
  @IsNumber()
  initialDeposit?: number;

  @ApiPropertyOptional({ description: '4-6 digit PIN for mobile app access' })
  @IsOptional()
  @IsString()
  appPin?: string;

  @ApiPropertyOptional({ description: "Child's full name (Child Savings)" })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({ description: 'Maturity date for Child Savings (ISO date)' })
  @IsOptional()
  @IsDateString()
  maturityDate?: string;

  @ApiPropertyOptional({ enum: ContributionFrequency })
  @IsOptional()
  @IsEnum(ContributionFrequency)
  contributionFrequency?: ContributionFrequency;

  @ApiPropertyOptional({ description: "Child's date of birth (ISO date)" })
  @IsOptional()
  @IsDateString()
  childDateOfBirth?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  childSchool?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fatherName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  motherName?: string;
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
  @IsMoneyAmount()
  @TransformMoney()
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
  @IsMoneyAmount()
  @TransformMoney()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  narration?: string;
}

export class TellerTransferDto {
  @ApiProperty()
  @IsEntityId()
  accountId: string;

  @ApiProperty()
  @IsMoneyAmount()
  @TransformMoney()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty()
  @IsString()
  beneficiaryBank: string;

  @ApiProperty()
  @IsString()
  beneficiaryAccount: string;

  @ApiProperty()
  @IsString()
  beneficiaryName: string;

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
