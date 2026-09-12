import { prisma } from "@/lib/db";

/**
 * Whether a viewer may see a spot: its owner always, anyone else only when
 * the spot is shared with followers and they are an accepted one.
 */
export async function canViewSpot(spotId: string, viewerId: string): Promise<boolean> {
  const spot = await prisma.spot.findUnique({
    where: { id: spotId },
    select: { userId: true, visibility: true },
  });
  if (!spot) return false;
  if (spot.userId === viewerId) return true;
  if (spot.visibility === "PRIVATE") return false;

  const follow = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: viewerId, followingId: spot.userId } },
    select: { status: true },
  });
  return follow?.status === "ACCEPTED";
}
