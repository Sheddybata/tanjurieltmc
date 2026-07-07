import { BadRequestException } from '@nestjs/common';
import { AccountType, ContributionFrequency } from '@tanjuriel/database';

export const CHILD_SAVINGS_ACCOUNT_TYPE = AccountType.MY_PIKIN;

export const CHILD_SAVINGS_LABEL = 'Child Savings';

export interface ChildSavingsOpenInput {
  type: AccountType;
  label?: string;
  maturityDate?: string;
  contributionFrequency?: ContributionFrequency;
  childDateOfBirth?: string;
  childSchool?: string;
  fatherName?: string;
  motherName?: string;
  childPhotoUrl?: string;
}

export function assertChildSavingsOpenInput(
  dto: ChildSavingsOpenInput,
  options: { photoRequired: boolean; hasPhoto: boolean },
) {
  if (dto.type !== CHILD_SAVINGS_ACCOUNT_TYPE) return;

  if (!dto.label?.trim()) {
    throw new BadRequestException("Child's full name is required for Child Savings");
  }
  if (!dto.maturityDate) {
    throw new BadRequestException('Maturity date is required for Child Savings');
  }
  if (!dto.contributionFrequency) {
    throw new BadRequestException('Contribution frequency is required for Child Savings');
  }
  if (!dto.childDateOfBirth) {
    throw new BadRequestException("Child's date of birth is required for Child Savings");
  }
  if (!dto.childSchool?.trim()) {
    throw new BadRequestException('Current school is required for Child Savings');
  }
  if (!dto.fatherName?.trim()) {
    throw new BadRequestException("Father's name is required for Child Savings");
  }
  if (!dto.motherName?.trim()) {
    throw new BadRequestException("Mother's name is required for Child Savings");
  }
  if (options.photoRequired && !options.hasPhoto && !dto.childPhotoUrl) {
    throw new BadRequestException('A photo of the child is required for Child Savings');
  }

  const dob = new Date(dto.childDateOfBirth);
  if (Number.isNaN(dob.getTime()) || dob >= new Date()) {
    throw new BadRequestException("Child's date of birth must be a valid date in the past");
  }
}

export function childSavingsAccountData(
  dto: ChildSavingsOpenInput,
  childPhotoUrl?: string,
) {
  return {
    label: dto.label?.trim(),
    maturityDate: dto.maturityDate ? new Date(dto.maturityDate) : undefined,
    contributionFrequency: dto.contributionFrequency,
    childPhotoUrl,
    childDateOfBirth: dto.childDateOfBirth ? new Date(dto.childDateOfBirth) : undefined,
    childSchool: dto.childSchool?.trim(),
    fatherName: dto.fatherName?.trim(),
    motherName: dto.motherName?.trim(),
  };
}
