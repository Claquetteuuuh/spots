import { prisma } from "@/lib/db";
import { ApiError, successResponse, withAuth } from "@/lib/api-utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const POST = withAuth<RouteParams>(async (_request, authUser, { params }) => {
  const { id } = await params;

  const follow = await prisma.follow.findFirst({
    where: {
      id,
      followingId: authUser.userId,
      status: "PENDING",
    },
  });

  if (!follow) {
    throw new ApiError("Follow request not found", 404);
  }

  await prisma.follow.delete({ where: { id } });

  return successResponse({ deleted: true });
});
