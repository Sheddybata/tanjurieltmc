-- Account officers (member-level, all products/services)
CREATE TYPE "AccountOfficer" AS ENUM (
  'FANNA_P_HELLEN_TANCIT',
  'YASON_BARBARA',
  'DANLADI_DABANG_MERCY',
  'DAVID_VICTORIA',
  'BALA_DANJUMA_LUSA',
  'DAVID_ADENOYI_PHILIP'
);

ALTER TABLE "customers"
  ADD COLUMN "accountOfficer" "AccountOfficer",
  ADD COLUMN "accountOfficerAssignedAt" TIMESTAMP(3),
  ADD COLUMN "accountOfficerAssignedById" TEXT;

ALTER TABLE "customers"
  ADD CONSTRAINT "customers_accountOfficerAssignedById_fkey"
  FOREIGN KEY ("accountOfficerAssignedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "customers_accountOfficer_idx" ON "customers"("accountOfficer");

-- Raise all loan product maximums to ₦30,000,000
UPDATE "loan_products" SET "maxAmount" = 30000000;
