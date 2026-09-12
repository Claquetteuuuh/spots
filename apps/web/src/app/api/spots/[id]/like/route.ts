import { prisma } from "@/lib/db";
import { errorResponse, successResponse, withAuth } from "@/lib/api-utils";
import { canViewSpot } from "@/lib/spot-access";

type Ctx = { params: Promise<{ id: string }> };

/** Like a spot — your own included. Liking twice is still one like. */
export const POST = withAuth<Ctx>(async (_request, authUser, { params }) => {
  const { id } = await params;
  if (!(await canViewSpot(id, authUser.userId))) {
    return errorResponse("Spot not found", 404);
  }

  await prisma.spotLike.upsert({
    where: { spotId_userId: { spotId: id, userId: authUser.userId } },
    create: { spotId: id, userId: authUser.userId },
    update: {},
  });
  const likeCount = await prisma.spotLike.count({ where: { spotId: id } });

  return successResponse({ isLiked: true, likeCount });
});

/** Take a like back. */
export const DELETE = withAuth<Ctx>(async (_request, authUser, { params }) => {
  const { id } = await params;
  if (!(await canViewSpot(id, authUser.userId))) {
    return errorResponse("Spot not found", 404);
  }

  await prisma.spotLike.deleteMany({ where: { spotId: id, userId: authUser.userId } });
  const likeCount = await prisma.spotLike.count({ where: { spotId: id } });

  return successResponse({ isLiked: false, likeCount });
});
