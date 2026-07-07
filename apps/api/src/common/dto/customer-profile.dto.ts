import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CustomerTitle,
  EmploymentStatus,
  Gender,
  IncomeBand,
  MaritalStatus,
} from '@tanjuriel/database';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
} from 'class-validator';

export class CustomerProfileDto {
  @ApiPropertyOptional({ enum: CustomerTitle })
  @IsOptional()
  @IsEnum(CustomerTitle)
  title?: CustomerTitle;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ description: 'Surname' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiPropertyOptional({ description: 'Other name' })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiPropertyOptional({ enum: MaritalStatus })
  @IsOptional()
  @IsEnum(MaritalStatus)
  maritalStatus?: MaritalStatus;

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
  @IsString()
  alternatePhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(11, 11)
  @Matches(/^\d+$/)
  bvn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(11, 11)
  @Matches(/^\d+$/)
  nin?: string;

  @ApiProperty({ description: 'Street / residential address' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lga?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiPropertyOptional({ enum: EmploymentStatus })
  @IsOptional()
  @IsEnum(EmploymentStatus)
  employmentStatus?: EmploymentStatus;

  @ApiPropertyOptional({ description: 'Required when employmentStatus is OTHER' })
  @IsOptional()
  @IsString()
  employmentStatusNote?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  employmentStartDate?: string;

  @ApiPropertyOptional({ enum: IncomeBand })
  @IsOptional()
  @IsEnum(IncomeBand)
  incomeBand?: IncomeBand;

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
  @IsString()
  employerPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  employerEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employerAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  natureOfBusiness?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  officeNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  officePhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  officeState?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  officeLga?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value === '' || value == null ? undefined : Number(value)))
  @IsNumber()
  @Min(0)
  monthlyIncome?: number;
}
