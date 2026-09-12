import { prisma } from "@/lib/db";
import { errorResponse, successResponse, withAuth } from "@/lib/api-utils";

/**
 * Take one notification off the list for good. The follow itself is
 * untouched: a pending request can still be answered from the profile.
 */
export const POST = withAuth<{ params: Promise<{ id: string }> }>(
  async (_request, authUser, { params }) => {
    const { id } = await params;

    const follow = await prisma.follow.findUnique({
      where: { id },
      select: { followingId: true },
    });
    if (!follow || follow.followingId !== authUser.userId) {
      return errorResponse("Notification not found", 404);
    }

    await prisma.follow.update({
      where: { id },
      data: { dismissedAt: new Date(), readAt: new Date() },
    });

    return successResponse({ id });
  },
);
