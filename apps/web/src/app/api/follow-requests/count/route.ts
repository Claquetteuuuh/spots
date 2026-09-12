import { prisma } from "@/lib/db";
import { successResponse, withAuth } from "@/lib/api-utils";
import { likeNotificationWhere } from "@/lib/notifications";

/**
 * What the badge shows: follow requests, the week's new followers and the
 * week's likes the viewer has not read — opening the page reads them,
 * unless they were marked unread on purpose; dismissed ones never count.
 */
export const GET = withAuth(async (_request, authUser) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [follows, likes] = await Promise.all([
    prisma.follow.count({
      where: {
        followingId: authUser.userId,
        dismissedAt: null,
        readAt: null,
        OR: [{ status: "PENDING" }, { status: "ACCEPTED", createdAt: { gte: sevenDaysAgo } }],
      },
    }),
    prisma.spotLike.count({
      where: {
        ...likeNotificationWhere(authUser.userId),
        dismissedAt: null,
        readAt: null,
        createdAt: { gte: sevenDaysAgo },
      },
    }),
  ]);

  return successResponse({ count: follows + likes });
});
