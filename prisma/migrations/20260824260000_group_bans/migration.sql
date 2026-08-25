-- CreateTable
CREATE TABLE "group_ban" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bannedById" TEXT NOT NULL,
    "reason" VARCHAR(200),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_ban_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "group_ban_userId_idx" ON "group_ban"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "group_ban_groupId_userId_key" ON "group_ban"("groupId", "userId");

-- AddForeignKey
ALTER TABLE "group_ban" ADD CONSTRAINT "group_ban_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_ban" ADD CONSTRAINT "group_ban_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_ban" ADD CONSTRAINT "group_ban_bannedById_fkey" FOREIGN KEY ("bannedById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

