-- CreateEnum
CREATE TYPE "ConversationOrigin" AS ENUM ('SWIPE', 'FRIEND');

-- AlterTable
ALTER TABLE "match" ADD COLUMN     "origin" "ConversationOrigin" NOT NULL DEFAULT 'SWIPE';

