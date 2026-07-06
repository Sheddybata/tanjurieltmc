import { IsNumber, IsOptional, IsString, Min, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LoanStatus } from '@tanjuriel/database';
import { IsEntityId } from '../../../common/validators/entity-id.decorator';

export class CreateLoanDto {
  @ApiProperty()
  @IsEntityId()
  customerId: string;

  @ApiProperty()
  @IsEntityId()
  productId: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  principalAmount: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  tenureMonths: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  purpose?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  collateral?: string;
}

export class LoanActionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;
}

export class LoanFilterDto {
  @ApiPropertyOptional({ enum: LoanStatus })
  @IsOptional()
  @IsEnum(LoanStatus)
  status?: LoanStatus;

  @ApiPropertyOptional()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  limit?: number;
}
