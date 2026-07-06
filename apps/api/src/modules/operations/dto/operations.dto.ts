import { IsString, IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentRequestType, SettlementProvider } from '@tanjuriel/database';
import { IsEntityId } from '../../../common/validators/entity-id.decorator';
import { TransformMoney } from '../../../common/validators/money.decorator';

export class ApproveRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({ description: 'Bank transfer reference from Zenith/Opay/Moniepoint' })
  @IsOptional()
  @IsString()
  externalBankRef?: string;
}

export class RejectRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;
}

export class ListPendingDto {
  @ApiPropertyOptional({ enum: PaymentRequestType })
  @IsOptional()
  @IsEnum(PaymentRequestType)
  type?: PaymentRequestType;

  @ApiPropertyOptional()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  limit?: number;
}

export class CustomerDepositRequestDto {
  @ApiProperty()
  @IsEntityId()
  accountId: string;

  @ApiProperty()
  @TransformMoney()
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ enum: SettlementProvider })
  @IsEnum(SettlementProvider)
  settlementProvider: SettlementProvider;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerNote?: string;
}

export class CustomerTransferRequestDto {
  @ApiProperty()
  @IsEntityId()
  accountId: string;

  @ApiProperty()
  @TransformMoney()
  @IsNumber()
  @Min(1)
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

  @ApiProperty()
  @IsString()
  pin: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  narration?: string;
}

export class CustomerWithdrawalRequestDto {
  @ApiProperty()
  @IsEntityId()
  accountId: string;

  @ApiProperty()
  @TransformMoney()
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty()
  @IsString()
  pin: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  narration?: string;
}
