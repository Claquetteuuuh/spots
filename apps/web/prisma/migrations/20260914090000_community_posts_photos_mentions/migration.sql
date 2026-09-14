-- A community post can carry several photos: each one moves to its own row.
CREATE TABLE "SpotPhotoImage" (
    "id" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "photoKey" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SpotPhotoImage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SpotPhotoImage_photoId_position_idx" ON "SpotPhotoImage"("photoId", "position");

ALTER TABLE "SpotPhotoImage" ADD CONSTRAINT "SpotPhotoImage_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "SpotPhoto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Everything posted so far becomes the single photo of its post.
INSERT INTO "SpotPhotoImage" ("id", "photoId", "photoUrl", "photoKey", "position")
SELECT "id", "id", "photoUrl", "photoKey", 0 FROM "SpotPhoto";

ALTER TABLE "SpotPhoto" DROP COLUMN "photoUrl";
ALTER TABLE "SpotPhoto" DROP COLUMN "photoKey";

-- Who a post names with an @, resolved to the account meant.
CREATE TABLE "SpotPhotoMention" (
    "id" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "SpotPhotoMention_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SpotPhotoMention_photoId_userId_key" ON "SpotPhotoMention"("photoId", "userId");

CREATE INDEX "SpotPhotoMention_userId_idx" ON "SpotPhotoMention"("userId");

ALTER TABLE "SpotPhotoMention" ADD CONSTRAINT "SpotPhotoMention_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "SpotPhoto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SpotPhotoMention" ADD CONSTRAINT "SpotPhotoMention_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
