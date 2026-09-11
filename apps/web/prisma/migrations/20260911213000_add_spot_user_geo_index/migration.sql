-- CreateIndex
CREATE INDEX "Spot_userId_latitude_longitude_idx" ON "Spot"("userId", "latitude", "longitude");
