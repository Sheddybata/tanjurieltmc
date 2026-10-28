-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'ACCOUNT_OFFICER';

-- AlterTable
ALTER TABLE "users" ADD COLUMN "accountOfficer" "AccountOfficer";

-- CreateIndex
CREATE UNIQUE INDEX "users_accountOfficer_key" ON "users"("accountOfficer");
