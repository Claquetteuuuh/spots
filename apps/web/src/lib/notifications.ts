import { prisma } from "@/lib/db";

export type NotificationKind = "follow" | "like";

interface NotificationRef {
  kind: NotificationKind;
  dismissed: boolean;
}

/**
 * A notification id is either a Follow (someone follows the viewer) or a
 * SpotLike (someone liked their spot). Says which, when it is theirs.
 */
export async function findNotification(id: string, userId: string): Promise<NotificationRef | null> {
  const follow = await prisma.follow.findUnique({
    where: { id },
    select: { followingId: true, dismissedAt: true },
  });
  if (follow) {
    return follow.followingId === userId ? { kind: "follow", dismissed: !!follow.dismissedAt } : null;
  }

  const like = await prisma.spotLike.findUnique({
    where: { id },
    select: { dismissedAt: true, spot: { select: { userId: true } } },
  });
  if (like) {
    return like.spot.userId === userId ? { kind: "like", dismissed: !!like.dismissedAt } : null;
  }

  return null;
}

/** Likes on the viewer's spots, by other people — their own do not notify. */
export function likeNotificationWhere(userId: string) {
  return { spot: { userId }, userId: { not: userId } } as const;
}
