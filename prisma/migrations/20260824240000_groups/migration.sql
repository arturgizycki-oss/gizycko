-- CreateEnum
CREATE TYPE "GroupVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "GroupRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'GROUP_INVITE';

-- AlterTable
ALTER TABLE "post" ADD COLUMN     "groupId" TEXT;

-- CreateTable
CREATE TABLE "group" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "description" VARCHAR(1000),
    "visibility" "GroupVisibility" NOT NULL DEFAULT 'PUBLIC',
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_member" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "GroupRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_invite" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "invitedUserId" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_invite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "group_visibility_createdAt_idx" ON "group"("visibility", "createdAt");

-- CreateIndex
CREATE INDEX "group_member_userId_idx" ON "group_member"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "group_member_groupId_userId_key" ON "group_member"("groupId", "userId");

-- CreateIndex
CREATE INDEX "group_invite_invitedUserId_status_idx" ON "group_invite"("invitedUserId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "group_invite_groupId_invitedUserId_key" ON "group_invite"("groupId", "invitedUserId");

-- CreateIndex
CREATE INDEX "post_groupId_createdAt_idx" ON "post"("groupId", "createdAt");

-- AddForeignKey
ALTER TABLE "post" ADD CONSTRAINT "post_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group" ADD CONSTRAINT "group_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_member" ADD CONSTRAINT "group_member_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_member" ADD CONSTRAINT "group_member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_invite" ADD CONSTRAINT "group_invite_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_invite" ADD CONSTRAINT "group_invite_invitedUserId_fkey" FOREIGN KEY ("invitedUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_invite" ADD CONSTRAINT "group_invite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

