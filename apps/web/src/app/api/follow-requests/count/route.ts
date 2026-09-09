import { prisma } from "@/lib/db";
import { successResponse, withAuth } from "@/lib/api-utils";

export const GET = withAuth(async (_request, authUser) => {
  const count = await prisma.follow.count({
    where: {
      followingId: authUser.userId,
      status: "PENDING",
    },
  });

  return successResponse({ count });
});
