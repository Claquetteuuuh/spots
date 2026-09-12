-- The global "seen" stamp becomes per-notification state
ALTER TABLE "User" DROP COLUMN "notificationsSeenAt";

-- AlterTable
ALTER TABLE "Follow"
  ADD COLUMN "readAt" TIMESTAMP(3),
  ADD COLUMN "unreadKept" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "dismissedAt" TIMESTAMP(3);
