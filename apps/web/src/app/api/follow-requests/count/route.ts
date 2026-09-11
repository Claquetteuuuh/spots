import { prisma } from "@/lib/db";
import { successResponse, withAuth } from "@/lib/api-utils";

export const GET = withAuth(async (_request, authUser) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [pendingCount, newFollowersCount] = await Promise.all([
    prisma.follow.count({
      where: {
        followingId: authUser.userId,
        status: "PENDING",
      },
    }),
    prisma.follow.count({
      where: {
        followingId: authUser.userId,
        status: "ACCEPTED",
        createdAt: { gte: sevenDaysAgo },
      },
    }),
  ]);

  return successResponse({ count: pendingCount + newFollowersCount });
});
