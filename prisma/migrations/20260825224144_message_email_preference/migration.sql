-- AlterTable
ALTER TABLE "user" ADD COLUMN     "emailOnMessage" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "messageEmailAt" TIMESTAMP(3);
