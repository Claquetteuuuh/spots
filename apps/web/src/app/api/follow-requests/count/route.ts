import { prisma } from "@/lib/db";
import { successResponse, withAuth } from "@/lib/api-utils";

/**
 * What the badge shows: follow requests and new followers the viewer has
 * not looked at yet. Opening the notifications page (POST …/seen) draws
 * the line; anything before it no longer counts.
 */
export const GET = withAuth(async (_request, authUser) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const viewer = await prisma.user.findUnique({
    where: { id: authUser.userId },
    select: { notificationsSeenAt: true },
  });
  const seenAt = viewer?.notificationsSeenAt ?? null;
  const newFollowersSince = seenAt && seenAt > sevenDaysAgo ? seenAt : sevenDaysAgo;

  const [pendingCount, newFollowersCount] = await Promise.all([
    prisma.follow.count({
      where: {
        followingId: authUser.userId,
        status: "PENDING",
        ...(seenAt ? { createdAt: { gt: seenAt } } : {}),
      },
    }),
    prisma.follow.count({
      where: {
        followingId: authUser.userId,
        status: "ACCEPTED",
        createdAt: { gt: newFollowersSince },
      },
    }),
  ]);

  return successResponse({ count: pendingCount + newFollowersCount });
});
