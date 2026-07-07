import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountType, ContributionFrequency } from '@tanjuriel/database';

const MOBILE_OPEN_TYPES = [AccountType.DAILY_SAVINGS, AccountType.MY_PIKIN] as const;
export type MobileOpenAccountType = (typeof MOBILE_OPEN_TYPES)[number];

export class CustomerOpenAccountDto {
  @ApiProperty({ enum: MOBILE_OPEN_TYPES, description: 'Daily Savings or Child Savings only' })
  @IsEnum(MOBILE_OPEN_TYPES)
  type: MobileOpenAccountType;

  @ApiProperty({ enum: ContributionFrequency })
  @IsEnum(ContributionFrequency)
  contributionFrequency: ContributionFrequency;

  @ApiPropertyOptional({ description: "Child's full name (required for Child Savings)" })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({ description: 'Maturity date for Child Savings (ISO date)' })
  @IsOptional()
  @IsDateString()
  maturityDate?: string;

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
