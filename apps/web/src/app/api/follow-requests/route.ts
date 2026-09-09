import { prisma } from "@/lib/db";
import { successResponse, withAuth } from "@/lib/api-utils";

export const GET = withAuth(async (_request, authUser) => {
  const requests = await prisma.follow.findMany({
    where: {
      followingId: authUser.userId,
      status: "PENDING",
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
  });

  return successResponse(requests);
});
