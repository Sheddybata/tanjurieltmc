import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CollateralType } from '@tanjuriel/database';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';

export class CustomerApplyLoanDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  principalAmount: number;

  @ApiProperty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  tenureMonths: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  purpose?: string;

  @ApiProperty({ description: 'Collateral description (required when product requires collateral)' })
  @IsOptional()
  @IsString()
  collateral?: string;

  @ApiPropertyOptional({ enum: CollateralType })
  @IsOptional()
  @IsEnum(CollateralType)
  collateralType?: CollateralType;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value === '' || value == null ? undefined : Number(value)))
  @IsNumber()
  @Min(1)
  collateralEstimatedValue?: number;

  @ApiPropertyOptional({ description: 'Guarantor full name (required when product requires collateral)' })
  @IsOptional()
  @IsString()
  guarantorName?: string;

  @ApiPropertyOptional({ description: 'Guarantor phone (required when product requires collateral)' })
  @IsOptional()
  @IsString()
  guarantorPhone?: string;

  @ApiProperty()
  @IsString()
  @MinLength(4)
  pin: string;
}
