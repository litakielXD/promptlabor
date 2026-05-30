-- AlterTable
ALTER TABLE "users" ADD COLUMN "passwordResetTokenHash" TEXT;
ALTER TABLE "users" ADD COLUMN "passwordResetExpires" DATETIME;
ALTER TABLE "users" ADD COLUMN "passwordResetSentAt" DATETIME;
