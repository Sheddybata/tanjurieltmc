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
