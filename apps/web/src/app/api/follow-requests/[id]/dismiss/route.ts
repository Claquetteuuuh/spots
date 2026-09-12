import { prisma } from "@/lib/db";
import { errorResponse, successResponse, withAuth } from "@/lib/api-utils";
import { findNotification } from "@/lib/notifications";

/**
 * Take one notification off the list for good. The follow or like itself
 * is untouched: a pending request can still be answered from the profile.
 */
export const POST = withAuth<{ params: Promise<{ id: string }> }>(
  async (_request, authUser, { params }) => {
    const { id } = await params;

    const found = await findNotification(id, authUser.userId);
    if (!found) {
      return errorResponse("Notification not found", 404);
    }

    const data = { dismissedAt: new Date(), readAt: new Date() };
    if (found.kind === "follow") {
      await prisma.follow.update({ where: { id }, data });
    } else {
      await prisma.spotLike.update({ where: { id }, data });
    }

    return successResponse({ id });
  },
);
