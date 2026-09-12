import { prisma } from "@/lib/db";
import { successResponse, withAuth } from "@/lib/api-utils";

/** The viewer has looked at their notifications: the badge starts over from now. */
export const POST = withAuth(async (_request, authUser) => {
  const seenAt = new Date();
  await prisma.user.update({
    where: { id: authUser.userId },
    data: { notificationsSeenAt: seenAt },
  });
  return successResponse({ seenAt: seenAt.toISOString() });
});
