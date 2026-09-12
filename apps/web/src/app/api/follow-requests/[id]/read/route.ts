import { prisma } from "@/lib/db";
import { notificationReadSchema } from "@trs/shared/validation";
import { errorResponse, successResponse, validateBody, withAuth } from "@/lib/api-utils";
import { findNotification } from "@/lib/notifications";

/** Mark one notification read or unread. Unread by hand stays unread until read by hand. */
export const PATCH = withAuth<{ params: Promise<{ id: string }> }>(
  async (request, authUser, { params }) => {
    const { id } = await params;
    const { read } = validateBody(notificationReadSchema, await request.json());

    const found = await findNotification(id, authUser.userId);
    if (!found || found.dismissed) {
      return errorResponse("Notification not found", 404);
    }

    const data = read ? { readAt: new Date(), unreadKept: false } : { readAt: null, unreadKept: true };
    const select = { id: true, readAt: true, unreadKept: true };
    const updated =
      found.kind === "follow"
        ? await prisma.follow.update({ where: { id }, data, select })
        : await prisma.spotLike.update({ where: { id }, data, select });

    return successResponse(updated);
  },
);
