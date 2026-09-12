import { prisma } from "@/lib/db";
import { successResponse, withAuth } from "@/lib/api-utils";

/**
 * The viewer has the notifications page in front of them: whatever is
 * listed and never read is read from now — except what they marked
 * unread themselves, which stays that way until they say otherwise.
 */
export const POST = withAuth(async (_request, authUser) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { count } = await prisma.follow.updateMany({
    where: {
      followingId: authUser.userId,
      dismissedAt: null,
      readAt: null,
      unreadKept: false,
      OR: [{ status: "PENDING" }, { status: "ACCEPTED", createdAt: { gte: thirtyDaysAgo } }],
    },
    data: { readAt: new Date() },
  });

  return successResponse({ count });
});
