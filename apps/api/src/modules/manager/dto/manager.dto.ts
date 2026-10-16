import { IsBoolean, IsOptional, IsString, IsEnum, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { LoanStatus } from '@tanjuriel/database';
import { IsEntityId } from '../../../common/validators/entity-id.decorator';
import { CustomerApplyLoanDto } from '../../customer/dto/customer-loan.dto';

export class ManagerApplyLoanDto extends OmitType(CustomerApplyLoanDto, ['pin'] as const) {
  @IsEntityId()
  customerId: string;
}

export { CustomerLoanQuoteDto as ManagerLoanQuoteDto } from '../../customer/dto/customer-loan.dto';

/** @deprecated Use ManagerApplyLoanDto */
export type CreateLoanDto = ManagerApplyLoanDto;

export class LoanActionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;
}

export class DeleteLoanDto {
  @ApiProperty({ description: 'Reason for deletion (stored in audit log)' })
  @IsString()
  @MinLength(3)
  reason: string;

  @ApiPropertyOptional({
    description: 'Must be true to delete a loan that was already disbursed (reverses savings credit)',
  })
  @IsOptional()
  @IsBoolean()
  confirmDisbursed?: boolean;
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
