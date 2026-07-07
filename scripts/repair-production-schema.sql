-- Run in Supabase SQL editor if Railway migrate deploy failed.
-- Safe to re-run (IF NOT EXISTS).

ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "label" TEXT;
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "maturityDate" TIMESTAMP(3);
ALTER TABLE "payment_requests" ADD COLUMN IF NOT EXISTS "loanId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payment_requests_loanId_fkey'
  ) THEN
    ALTER TABLE "payment_requests"
      ADD CONSTRAINT "payment_requests_loanId_fkey"
      FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "payment_requests_loanId_idx" ON "payment_requests"("loanId");

ALTER TYPE "PaymentRequestType" ADD VALUE IF NOT EXISTS 'LOAN_REPAYMENT';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ContributionFrequency') THEN
    CREATE TYPE "ContributionFrequency" AS ENUM ('DAILY', 'WEEKLY', 'BI_WEEKLY', 'MONTHLY');
  END IF;
END $$;

ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "contributionFrequency" "ContributionFrequency";

ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "childPhotoUrl" TEXT;
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "childDateOfBirth" TIMESTAMP(3);
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "childSchool" TEXT;
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "fatherName" TEXT;
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "motherName" TEXT;

-- Loan application profile (20250706235959)
DO $$ BEGIN CREATE TYPE "LocationType" AS ENUM ('RURAL', 'URBAN', 'SEMI_URBAN'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "EducationLevel" AS ENUM ('QURANIC', 'PRIMARY', 'JUNIOR_SECONDARY', 'SENIOR_SECONDARY', 'TERTIARY'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "MaritalStatus" AS ENUM ('MARRIED', 'SINGLE', 'DIVORCED', 'WIDOWED', 'LIVING_WITH_COMPANION'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "LoanCategory" AS ENUM ('PERSONAL', 'BUSINESS', 'ASSET_FINANCING'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "LoanRepaymentPlan" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "applicantFullName" TEXT;
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "locationType" "LocationType";
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "applicantAddress" TEXT;
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "applicantGender" "Gender";
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "applicantDateOfBirth" TIMESTAMP(3);
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "educationLevel" "EducationLevel";
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "maritalStatus" "MaritalStatus";
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "businessActivities" JSONB;
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "yearsOfExperience" INTEGER;
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "unionName" TEXT;
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "nextOfKinName" TEXT;
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "nextOfKinPhone" TEXT;
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "nextOfKinAddress" TEXT;
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "loanCategory" "LoanCategory";
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "repaymentPlan" "LoanRepaymentPlan";
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "tenurePeriods" INTEGER;
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "openingFeeAmount" DECIMAL(18,2);
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "upfrontFeeAmount" DECIMAL(18,2);
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "flatInterestAmount" DECIMAL(18,2);
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "installmentAmount" DECIMAL(18,2);
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "contractAcceptedAt" TIMESTAMP(3);
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "contractVersion" TEXT;

-- Customer KYC profile (20250707100000)
DO $$ BEGIN CREATE TYPE "CustomerTitle" AS ENUM ('MR', 'MRS', 'MS', 'MISS', 'DR', 'CHIEF', 'ENGR', 'BARR', 'OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "EmploymentStatus" AS ENUM ('EMPLOYED', 'SELF_EMPLOYED', 'UNEMPLOYED', 'RETIRED', 'STUDENT', 'OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "IncomeBand" AS ENUM ('BELOW_50K', 'BAND_51K_250K', 'BAND_251K_500K', 'BAND_501K_1M', 'BAND_1M_5M', 'BAND_5M_10M', 'BAND_10M_20M', 'ABOVE_20M'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "title" "CustomerTitle";
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "maritalStatus" "MaritalStatus";
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "alternatePhone" TEXT;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "lga" TEXT;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "employmentStatus" "EmploymentStatus";
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "employmentStatusNote" TEXT;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "employmentStartDate" TIMESTAMP(3);
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "incomeBand" "IncomeBand";
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "employerPhone" TEXT;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "employerEmail" TEXT;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "employerAddress" TEXT;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "natureOfBusiness" TEXT;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "officeNumber" TEXT;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "officePhone" TEXT;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "officeState" TEXT;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "officeLga" TEXT;
