-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('IMAGE', 'VIDEO', 'AUDIO');

-- AlterTable
ALTER TABLE "message" ADD COLUMN     "mediaKind" "MediaKind",
ADD COLUMN     "mediaName" VARCHAR(200),
ADD COLUMN     "mediaType" VARCHAR(60),
ADD COLUMN     "mediaUrl" TEXT;

