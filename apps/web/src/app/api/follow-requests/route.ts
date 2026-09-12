import { prisma } from "@/lib/db";
import { successResponse, withAuth } from "@/lib/api-utils";

export const GET = withAuth(async (_request, authUser) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [pendingRequests, newFollowers] = await Promise.all([
    prisma.follow.findMany({
      where: {
        followingId: authUser.userId,
        status: "PENDING",
        dismissedAt: null,
      },
      orderBy: { createdAt: "desc" },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    }),
    prisma.follow.findMany({
      where: {
        followingId: authUser.userId,
        status: "ACCEPTED",
        createdAt: { gte: thirtyDaysAgo },
        dismissedAt: null,
      },
      orderBy: { createdAt: "desc" },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    }),
  ]);

  return successResponse({ pendingRequests, newFollowers });
});
