-- CreateTable
CREATE TABLE "SpotLike" (
    "id" TEXT NOT NULL,
    "spotId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "unreadKept" BOOLEAN NOT NULL DEFAULT false,
    "dismissedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpotLike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SpotLike_userId_createdAt_idx" ON "SpotLike"("userId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "SpotLike_spotId_userId_key" ON "SpotLike"("spotId", "userId");

-- AddForeignKey
ALTER TABLE "SpotLike" ADD CONSTRAINT "SpotLike_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "Spot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpotLike" ADD CONSTRAINT "SpotLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
