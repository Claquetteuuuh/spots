import { prisma } from "@/lib/db";
import { successResponse, withAuth } from "@/lib/api-utils";

export const GET = withAuth(async (_request, authUser) => {
  const sentRequests = await prisma.follow.findMany({
    where: {
      followerId: authUser.userId,
      status: "PENDING",
    },
    orderBy: { createdAt: "desc" },
    include: {
      following: {
        select: {
          id: true,
          username: true,
          name: true,
          avatarUrl: true,
        },
      },
    },
  });

  return successResponse(sentRequests);
});
