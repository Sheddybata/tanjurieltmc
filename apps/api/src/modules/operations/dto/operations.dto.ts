import { IsString, IsOptional, IsEnum, IsUUID, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentRequestType, SettlementProvider } from '@tanjuriel/database';

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
  @IsUUID()
  accountId: string;

  @ApiProperty()
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
  @IsUUID()
  accountId: string;

  @ApiProperty()
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
