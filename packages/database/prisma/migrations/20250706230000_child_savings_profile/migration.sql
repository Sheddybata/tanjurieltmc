-- Child Savings (MY_PIKIN) profile fields on accounts

ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "childPhotoUrl" TEXT;
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "childDateOfBirth" TIMESTAMP(3);
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "childSchool" TEXT;
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "fatherName" TEXT;
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "motherName" TEXT;
