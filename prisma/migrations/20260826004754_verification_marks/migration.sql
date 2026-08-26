-- AlterTable
ALTER TABLE "user" ADD COLUMN     "paymentVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "phoneVerifiedAt" TIMESTAMP(3);
