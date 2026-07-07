import { calculateAge, genderLabel, maritalLabel } from '@/lib/loan-application-options';

export const CUSTOMER_TITLES = [
  { value: 'MR', label: 'Mr' },
  { value: 'MRS', label: 'Mrs' },
  { value: 'MS', label: 'Ms' },
  { value: 'MISS', label: 'Miss' },
  { value: 'DR', label: 'Dr' },
  { value: 'CHIEF', label: 'Chief' },
  { value: 'ENGR', label: 'Engr' },
  { value: 'BARR', label: 'Barr' },
  { value: 'OTHER', label: 'Other' },
] as const;

export const MARITAL_STATUSES = [
  { value: 'MARRIED', label: 'Married' },
  { value: 'SINGLE', label: 'Single' },
  { value: 'DIVORCED', label: 'Divorced' },
  { value: 'WIDOWED', label: 'Widowed' },
  { value: 'LIVING_WITH_COMPANION', label: 'Living with companion' },
] as const;

export const GENDERS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
] as const;

export const EMPLOYMENT_STATUSES = [
  { value: 'EMPLOYED', label: 'Employed' },
  { value: 'SELF_EMPLOYED', label: 'Self-employed' },
  { value: 'UNEMPLOYED', label: 'Unemployed' },
  { value: 'RETIRED', label: 'Retired' },
  { value: 'STUDENT', label: 'Student' },
  { value: 'OTHER', label: 'Others (please specify)' },
] as const;

export const INCOME_BANDS = [
  { value: 'BELOW_50K', label: 'Less than ₦50,000' },
  { value: 'BAND_51K_250K', label: '₦51,000 – ₦250,000' },
  { value: 'BAND_251K_500K', label: '₦251,000 – ₦500,000' },
  { value: 'BAND_501K_1M', label: '₦501,000 – less than ₦1 million' },
  { value: 'BAND_1M_5M', label: '₦1 million – less than ₦5 million' },
  { value: 'BAND_5M_10M', label: '₦5 million – less than ₦10 million' },
  { value: 'BAND_10M_20M', label: '₦10 million – less than ₦20 million' },
  { value: 'ABOVE_20M', label: 'Above ₦20 million' },
] as const;

export const REGISTRATION_STEP_TITLES = [
  'Personal information',
  'Contact details',
  'Valid means of identification',
  'Employment details',
  'Member photo',
  'Create PIN',
] as const;

export { calculateAge, genderLabel, maritalLabel };

export function titleLabel(v?: string | null) {
  return CUSTOMER_TITLES.find((t) => t.value === v)?.label ?? v ?? '—';
}

export function employmentStatusLabel(v?: string | null) {
  return EMPLOYMENT_STATUSES.find((t) => t.value === v)?.label ?? v ?? '—';
}

export function incomeBandLabel(v?: string | null) {
  return INCOME_BANDS.find((t) => t.value === v)?.label ?? v ?? '—';
}

export function showsEmployerFields(status: string) {
  return status === 'EMPLOYED' || status === 'SELF_EMPLOYED';
}

export function showsEmploymentDate(status: string) {
  return status === 'EMPLOYED';
}
