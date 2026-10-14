import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateLoanFlatInterestRateDto {
  @ApiProperty({ description: 'Flat interest rate on principal, e.g. 0.03 for 3%', example: 0.03 })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  @Max(1)
  flatInterestRate: number;
}

export class RecalculateLoansInterestDto {
  @ApiPropertyOptional({ description: 'Rate to apply; defaults to platform setting' })
  @IsOptional()
  @Transform(({ value }) => (value == null || value === '' ? undefined : Number(value)))
  @IsNumber()
  @Min(0)
  @Max(1)
  flatInterestRate?: number;

  @ApiPropertyOptional({
    description: 'When true, includes disbursed/active loans (not closed/rejected). Use with care.',
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  applyToAllLoans?: boolean;

  @ApiPropertyOptional({
    description: 'When true, recalculate every eligible loan even if already at the target rate',
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  force?: boolean;
}

export class RecalculateSingleLoanDto {
  @ApiProperty({ example: 0.03 })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  @Max(1)
  flatInterestRate: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  loanId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  loanNumber?: string;
}
