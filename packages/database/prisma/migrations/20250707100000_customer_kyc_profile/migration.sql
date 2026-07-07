-- Extended customer KYC profile
DO $$ BEGIN CREATE TYPE "CustomerTitle" AS ENUM ('MR', 'MRS', 'MS', 'MISS', 'DR', 'CHIEF', 'ENGR', 'BARR', 'OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "EmploymentStatus" AS ENUM ('EMPLOYED', 'SELF_EMPLOYED', 'UNEMPLOYED', 'RETIRED', 'STUDENT', 'OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "IncomeBand" AS ENUM ('BELOW_50K', 'BAND_51K_250K', 'BAND_251K_500K', 'BAND_501K_1M', 'BAND_1M_5M', 'BAND_5M_10M', 'BAND_10M_20M', 'ABOVE_20M'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "MaritalStatus" AS ENUM ('MARRIED', 'SINGLE', 'DIVORCED', 'WIDOWED', 'LIVING_WITH_COMPANION'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

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
