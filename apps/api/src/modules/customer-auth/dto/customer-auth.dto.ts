import {
  IsString,
  IsNotEmpty,
  Length,
  Matches,
  IsEmail,
  IsOptional,
  IsDateString,
  IsEnum,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '@tanjuriel/database';
import { Transform } from 'class-transformer';

export class CustomerLoginDto {
  @ApiProperty({ example: '08012345678' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: '1234' })
  @IsString()
  @Length(4, 6)
  @Matches(/^\d+$/)
  pin: string;
}

export class CustomerRegisterDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiProperty()
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({ enum: Gender })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty()
  @IsString()
  @Length(11, 11)
  @Matches(/^\d+$/)
  bvn: string;

  @ApiProperty()
  @IsString()
  @Length(11, 11)
  @Matches(/^\d+$/)
  nin: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  occupation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value === '' || value == null ? undefined : Number(value)))
  @IsNumber()
  @Min(0)
  monthlyIncome?: number;

  @ApiProperty()
  @IsString()
  @Length(4, 6)
  @Matches(/^\d+$/)
  pin: string;
}

export class CustomerChangePinDto {
  @ApiProperty()
  @IsString()
  @Length(4, 6)
  currentPin: string;

  @ApiProperty()
  @IsString()
  @Length(4, 6)
  newPin: string;
}
