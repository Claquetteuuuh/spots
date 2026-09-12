import { prisma } from "@/lib/db";
import { successResponse, withAuth } from "@/lib/api-utils";
import { likeNotificationWhere } from "@/lib/notifications";

const PERSON_SELECT = {
  id: true,
  username: true,
  name: true,
  avatarUrl: true,
} as const;

export const GET = withAuth(async (_request, authUser) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [pendingRequests, newFollowers, likes] = await Promise.all([
    prisma.follow.findMany({
      where: {
        followingId: authUser.userId,
        status: "PENDING",
        dismissedAt: null,
      },
      orderBy: { createdAt: "desc" },
      include: { follower: { select: PERSON_SELECT } },
    }),
    prisma.follow.findMany({
      where: {
        followingId: authUser.userId,
        status: "ACCEPTED",
        createdAt: { gte: thirtyDaysAgo },
        dismissedAt: null,
      },
      orderBy: { createdAt: "desc" },
      include: { follower: { select: PERSON_SELECT } },
    }),
    prisma.spotLike.findMany({
      where: {
        ...likeNotificationWhere(authUser.userId),
        createdAt: { gte: thirtyDaysAgo },
        dismissedAt: null,
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: PERSON_SELECT },
        spot: { select: { id: true, title: true, photoUrl: true } },
      },
    }),
  ]);

  return successResponse({ pendingRequests, newFollowers, likes });
});
