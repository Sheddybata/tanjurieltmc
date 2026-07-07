export const LOAN_OPENING_FEE = 1000;
export const LOAN_UPFRONT_RATE = 0.1;
export const LOAN_INTEREST_RATE = 0.1;

export const LOCATION_TYPES = ['RURAL', 'URBAN', 'SEMI_URBAN'] as const;
export const EDUCATION_LEVELS = ['QURANIC', 'PRIMARY', 'JUNIOR_SECONDARY', 'SENIOR_SECONDARY', 'TERTIARY'] as const;
export const MARITAL_STATUSES = ['MARRIED', 'SINGLE', 'DIVORCED', 'WIDOWED', 'LIVING_WITH_COMPANION'] as const;
export const LOAN_CATEGORIES = ['PERSONAL', 'BUSINESS', 'ASSET_FINANCING'] as const;
export const REPAYMENT_PLANS = ['DAILY', 'WEEKLY', 'MONTHLY'] as const;
export const GENDERS = ['MALE', 'FEMALE'] as const;
export const COLLATERAL_TYPES = [
  { value: 'PROPERTY', label: 'Property' },
  { value: 'VEHICLE', label: 'Vehicle' },
  { value: 'EQUIPMENT', label: 'Equipment' },
  { value: 'CASH', label: 'Cash / fixed deposit' },
  { value: 'OTHER', label: 'Other' },
] as const;

export const STEP_TITLES = [
  'Your details',
  'Loan request',
  'Collateral',
  'Agreement',
  'Review & submit',
] as const;

export function locationLabel(v: string) {
  return ({ RURAL: 'Rural', URBAN: 'Urban', SEMI_URBAN: 'Semi-urban' } as Record<string, string>)[v] ?? v;
}

export function educationLabel(v: string) {
  return ({
    QURANIC: 'Quranic school',
    PRIMARY: 'Primary',
    JUNIOR_SECONDARY: 'Junior secondary',
    SENIOR_SECONDARY: 'Senior secondary',
    TERTIARY: 'Tertiary',
  } as Record<string, string>)[v] ?? v;
}

export function maritalLabel(v: string) {
  return ({
    MARRIED: 'Married',
    SINGLE: 'Single',
    DIVORCED: 'Divorced',
    WIDOWED: 'Widowed',
    LIVING_WITH_COMPANION: 'Living with companion',
  } as Record<string, string>)[v] ?? v;
}

export function loanCategoryLabel(v: string) {
  return ({
    PERSONAL: 'Personal',
    BUSINESS: 'Business',
    ASSET_FINANCING: 'Asset financing',
  } as Record<string, string>)[v] ?? v;
}

export function repaymentPlanLabel(v: string) {
  return ({ DAILY: 'Daily', WEEKLY: 'Weekly', MONTHLY: 'Monthly' } as Record<string, string>)[v] ?? v;
}

export function repaymentPeriodUnit(v: string) {
  return ({ DAILY: 'days', WEEKLY: 'weeks', MONTHLY: 'months' } as Record<string, string>)[v] ?? 'periods';
}

export function genderLabel(v: string) {
  return ({ MALE: 'Male', FEMALE: 'Female' } as Record<string, string>)[v] ?? v;
}

export function calculateAge(dob: string): number | null {
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  if (today.getMonth() < d.getMonth() || (today.getMonth() === d.getMonth() && today.getDate() < d.getDate())) {
    age--;
  }
  return age;
}

export function localLoanQuote(principal: number, tenurePeriods: number) {
  const upfront = principal * LOAN_UPFRONT_RATE;
  const interest = principal * LOAN_INTEREST_RATE;
  const totalRepayable = principal + interest;
  const installmentAmount = tenurePeriods > 0 ? totalRepayable / tenurePeriods : totalRepayable;
  return {
    openingFee: LOAN_OPENING_FEE,
    upfrontFee: upfront,
    flatInterestAmount: interest,
    totalRepayable,
    installmentAmount,
    netDisbursement: principal - upfront,
  };
}

export interface LoanQuote {
  openingFee: number;
  upfrontFee: number;
  flatInterestAmount: number;
  totalRepayable: number;
  installmentAmount: number;
  netDisbursement: number;
}

export interface CustomerPrefill {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  state?: string;
  occupation?: string;
  accounts?: { accountNumber: string; type: string }[];
}
