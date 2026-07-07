-- CreateEnum
CREATE TYPE "ContributionFrequency" AS ENUM ('DAILY', 'WEEKLY', 'BI_WEEKLY', 'MONTHLY');

-- AlterTable
ALTER TABLE "accounts" ADD COLUMN "contributionFrequency" "ContributionFrequency";
