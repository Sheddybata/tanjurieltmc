import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CollateralType,
  EducationLevel,
  Gender,
  LoanCategory,
  LoanRepaymentPlan,
  LocationType,
  MaritalStatus,
} from '@tanjuriel/database';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CustomerLoanQuoteDto {
  @ApiProperty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  principalAmount: number;

  @ApiProperty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  tenurePeriods: number;

  @ApiProperty({ enum: LoanRepaymentPlan })
  @IsEnum(LoanRepaymentPlan)
  repaymentPlan: LoanRepaymentPlan;
}

export class CustomerApplyLoanDto {
  @ApiProperty()
  @IsString()
  applicantFullName: string;

  @ApiProperty({ enum: LocationType })
  @IsEnum(LocationType)
  locationType: LocationType;

  @ApiProperty()
  @IsString()
  applicantAddress: string;

  @ApiProperty({ enum: Gender })
  @IsEnum(Gender)
  applicantGender: Gender;

  @ApiProperty()
  @IsDateString()
  applicantDateOfBirth: string;

  @ApiProperty({ enum: EducationLevel })
  @IsEnum(EducationLevel)
  educationLevel: EducationLevel;

  @ApiProperty({ enum: MaritalStatus })
  @IsEnum(MaritalStatus)
  maritalStatus: MaritalStatus;

  @ApiProperty({ description: 'JSON array of business activity strings' })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [value];
      } catch {
        return value.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
    }
    return value;
  })
  @IsArray()
  @IsString({ each: true })
  businessActivities: string[];

  @ApiProperty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  yearsOfExperience: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unionName?: string;

  @ApiProperty()
  @IsString()
  nextOfKinName: string;

  @ApiProperty()
  @IsString()
  nextOfKinPhone: string;

  @ApiProperty()
  @IsString()
  nextOfKinAddress: string;

  @ApiProperty({ enum: LoanCategory })
  @IsEnum(LoanCategory)
  loanCategory: LoanCategory;

  @ApiProperty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  principalAmount: number;

  @ApiProperty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  tenurePeriods: number;

  @ApiProperty({ enum: LoanRepaymentPlan })
  @IsEnum(LoanRepaymentPlan)
  repaymentPlan: LoanRepaymentPlan;

  @ApiProperty()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  contractAccepted: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  purpose?: string;

  @ApiProperty({ description: 'Collateral description' })
  @IsString()
  collateral: string;

  @ApiProperty({ enum: CollateralType })
  @IsEnum(CollateralType)
  collateralType: CollateralType;

  @ApiProperty()
  @Transform(({ value }) => (value === '' || value == null ? undefined : Number(value)))
  @IsNumber()
  @Min(1)
  collateralEstimatedValue: number;

  @ApiProperty()
  @IsString()
  guarantorName: string;

  @ApiProperty()
  @IsString()
  guarantorPhone: string;

  @ApiProperty()
  @IsString()
  @MinLength(4)
  pin: string;
}
