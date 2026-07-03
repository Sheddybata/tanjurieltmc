-- Collateral, registration source, and loan product flags
CREATE TYPE "CollateralType" AS ENUM ('PROPERTY', 'VEHICLE', 'EQUIPMENT', 'GUARANTOR', 'CASH', 'OTHER');
CREATE TYPE "RegistrationSource" AS ENUM ('BRANCH', 'MOBILE');

ALTER TABLE "loan_products" ADD COLUMN "requiresCollateral" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "loans" ADD COLUMN "collateralType" "CollateralType";
ALTER TABLE "loans" ADD COLUMN "collateralEstimatedValue" DECIMAL(18,2);
ALTER TABLE "loans" ADD COLUMN "collateralPhotoUrl" TEXT;
ALTER TABLE "loans" ADD COLUMN "guarantorName" TEXT;
ALTER TABLE "loans" ADD COLUMN "guarantorPhone" TEXT;
ALTER TABLE "loans" ADD COLUMN "collateralVerifiedAt" TIMESTAMP(3);
ALTER TABLE "loans" ADD COLUMN "collateralVerifiedById" TEXT;
ALTER TABLE "loans" ADD COLUMN "collateralVerificationNote" TEXT;

ALTER TABLE "customers" ADD COLUMN "registrationSource" "RegistrationSource" NOT NULL DEFAULT 'BRANCH';
