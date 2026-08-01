-- AlterEnum
ALTER TYPE "Status" ADD VALUE 'COMPLETED';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "reminderSentAt" TIMESTAMP(3);