-- Enum value must be in its own migration (PostgreSQL restriction).
ALTER TYPE "PaymentRequestType" ADD VALUE IF NOT EXISTS 'LOAN_REPAYMENT';
