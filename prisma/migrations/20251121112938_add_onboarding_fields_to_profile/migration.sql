-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('STUDENT', 'PARENT');

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "accountType" "AccountType",
ADD COLUMN     "ageGroup" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "interests" TEXT[],
ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;
