import { CustomerProfileDto } from '../../../common/dto/customer-profile.dto';

/** Full profile replace on edit — same fields as branch registration (without PIN). */
export class UpdateCustomerDto extends CustomerProfileDto {}
