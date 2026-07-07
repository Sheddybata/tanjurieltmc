import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional, OmitType } from '@nestjs/swagger';
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
