import { IsEmail, IsEnum, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountOfficer, UserRole, UserStatus } from '@tanjuriel/database';
import { IsEntityId } from '../../../common/validators/entity-id.decorator';

const STAFF_ROLES = [UserRole.TELLER, UserRole.MANAGER, UserRole.ACCOUNT_OFFICER] as const;

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  employeeId: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsString()
  lastName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ enum: STAFF_ROLES })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({ description: 'Required for teller and manager' })
  @ValidateIf((o: CreateUserDto) => o.role === UserRole.TELLER || o.role === UserRole.MANAGER)
  @IsEntityId()
  branchId?: string;

  @ApiPropertyOptional({ enum: AccountOfficer, description: 'Required for account officer logins' })
  @ValidateIf((o: CreateUserDto) => o.role === UserRole.ACCOUNT_OFFICER)
  @IsEnum(AccountOfficer)
  accountOfficer?: AccountOfficer;
}

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEntityId()
  branchId?: string;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ enum: AccountOfficer })
  @IsOptional()
  @IsEnum(AccountOfficer)
  accountOfficer?: AccountOfficer;
}

export class ResetUserPasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(8)
  password: string;
}
