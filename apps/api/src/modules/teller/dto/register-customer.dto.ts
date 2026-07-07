import { IntersectionType } from '@nestjs/swagger';
import { CustomerProfileDto } from '../../../common/dto/customer-profile.dto';
import { CustomerRegisterPinDto } from '../../customer-auth/dto/customer-auth.dto';

export class RegisterCustomerDto extends IntersectionType(
  CustomerProfileDto,
  CustomerRegisterPinDto,
) {}
