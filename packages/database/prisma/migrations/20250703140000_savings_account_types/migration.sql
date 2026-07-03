-- Add kids and daily savings account types
ALTER TYPE "AccountType" ADD VALUE IF NOT EXISTS 'MY_PIKIN';
ALTER TYPE "AccountType" ADD VALUE IF NOT EXISTS 'DAILY_SAVINGS';
