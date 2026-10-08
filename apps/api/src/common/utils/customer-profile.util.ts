import { ConflictException } from '@nestjs/common';
import {
  CustomerTitle,
  EmploymentStatus,
  Gender,
  IncomeBand,
  MaritalStatus,
} from '@tanjuriel/database';

export interface CustomerProfileInput {
  title?: CustomerTitle;
  firstName: string;
  lastName: string;
  middleName?: string;
  maritalStatus?: MaritalStatus;
  dateOfBirth: string;
  gender: Gender;
  phone: string;
  alternatePhone?: string;
  email?: string;
  bvn?: string;
  nin?: string;
  address: string;
  lga?: string;
  city: string;
  state: string;
  employmentStatus?: EmploymentStatus;
  employmentStatusNote?: string;
  employmentStartDate?: string;
  incomeBand?: IncomeBand;
  occupation?: string;
  employer?: string;
  employerPhone?: string;
  employerEmail?: string;
  employerAddress?: string;
  natureOfBusiness?: string;
  officeNumber?: string;
  officePhone?: string;
  officeState?: string;
  officeLga?: string;
  monthlyIncome?: number;
}

export function customerProfileCreateData(dto: CustomerProfileInput, photoUrl?: string) {
  return {
    title: dto.title,
    firstName: dto.firstName.trim(),
    lastName: dto.lastName.trim(),
    middleName: dto.middleName?.trim() || null,
    maritalStatus: dto.maritalStatus,
    dateOfBirth: new Date(dto.dateOfBirth),
    gender: dto.gender,
    phone: dto.phone,
    alternatePhone: dto.alternatePhone?.trim() || null,
    email: dto.email?.trim() || null,
    bvn: dto.bvn?.trim() || null,
    nin: dto.nin?.trim() || null,
    address: dto.address.trim(),
    lga: dto.lga?.trim() || null,
    city: dto.city.trim(),
    state: dto.state.trim(),
    employmentStatus: dto.employmentStatus,
    employmentStatusNote: dto.employmentStatusNote?.trim() || null,
    employmentStartDate: dto.employmentStartDate ? new Date(dto.employmentStartDate) : null,
    incomeBand: dto.incomeBand,
    occupation: dto.occupation?.trim() || null,
    employer: dto.employer?.trim() || null,
    employerPhone: dto.employerPhone?.trim() || null,
    employerEmail: dto.employerEmail?.trim() || null,
    employerAddress: dto.employerAddress?.trim() || null,
    natureOfBusiness: dto.natureOfBusiness?.trim() || null,
    officeNumber: dto.officeNumber?.trim() || null,
    officePhone: dto.officePhone?.trim() || null,
    officeState: dto.officeState?.trim() || null,
    officeLga: dto.officeLga?.trim() || null,
    monthlyIncome: dto.monthlyIncome,
    photoUrl,
  };
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('234')) return `0${digits.slice(3)}`;
  if (digits.startsWith('0')) return digits;
  return `0${digits}`;
}

type ExistingCustomerIdentity = {
  phone: string;
  bvn: string | null;
  nin: string | null;
  firstName?: string;
  lastName?: string;
  customerNumber?: string;
};

/** Throws a 409 with which identifier(s) collided and optional existing member hint. */
export function throwIfCustomerIdentityTaken(
  existing: ExistingCustomerIdentity,
  input: { phone: string; bvn?: string | null; nin?: string | null },
): void {
  const taken: string[] = [];
  if (existing.phone === input.phone) taken.push('phone number');
  const bvn = input.bvn?.trim();
  if (bvn && existing.bvn === bvn) taken.push('BVN');
  const nin = input.nin?.trim();
  if (nin && existing.nin === nin) taken.push('NIN');

  if (taken.length === 0) {
    throw new ConflictException('Phone, BVN, or NIN is already registered');
  }

  const memberHint =
    existing.firstName && existing.lastName && existing.customerNumber
      ? ` (existing member: ${existing.firstName} ${existing.lastName}, ${existing.customerNumber})`
      : '';

  if (taken.length === 1) {
    throw new ConflictException(`This ${taken[0]} is already registered${memberHint}.`);
  }
  const last = taken.pop()!;
  throw new ConflictException(
    `This ${taken.join(', ')} and ${last} are already registered${memberHint}.`,
  );
}
