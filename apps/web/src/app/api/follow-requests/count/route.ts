import { prisma } from "@/lib/db";
import { successResponse, withAuth } from "@/lib/api-utils";

/**
 * What the badge shows: follow requests and the week's new followers the
 * viewer has not read — opening the page reads them, unless they were
 * marked unread on purpose; dismissed ones never count.
 */
export const GET = withAuth(async (_request, authUser) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const count = await prisma.follow.count({
    where: {
      followingId: authUser.userId,
      dismissedAt: null,
      readAt: null,
      OR: [{ status: "PENDING" }, { status: "ACCEPTED", createdAt: { gte: sevenDaysAgo } }],
    },
  });

  return successResponse({ count });
});
