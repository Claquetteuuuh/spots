import { Prisma, prisma } from "@/lib/db";
import { ApiError, successResponse, withAuth } from "@/lib/api-utils";

interface RouteParams {
  params: Promise<{ username: string }>;
}

async function resolveUser(username: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  if (!user) {
    throw new ApiError("User not found", 404);
  }
  return user;
}

export const POST = withAuth<RouteParams>(async (_request, authUser, { params }) => {
  const { username } = await params;
  const targetUser = await resolveUser(username);

  if (targetUser.id === authUser.userId) {
    throw new ApiError("You cannot follow yourself", 400);
  }

  try {
    const follow = await prisma.follow.create({
      data: {
        followerId: authUser.userId,
        followingId: targetUser.id,
        // status defaults to PENDING in schema
      },
    });
    return successResponse(follow, 201);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      // Check if it's a pending request or already accepted
      const existing = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: authUser.userId,
            followingId: targetUser.id,
          },
        },
        select: { status: true },
      });

      if (existing?.status === "PENDING") {
        throw new ApiError("Follow request already sent", 409);
      }
      throw new ApiError("You are already following this user", 409);
    }
    throw error;
  }
});

export const DELETE = withAuth<RouteParams>(async (_request, authUser, { params }) => {
  const { username } = await params;
  const targetUser = await resolveUser(username);

  const existing = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: authUser.userId,
        followingId: targetUser.id,
      },
    },
  });

  if (!existing) {
    throw new ApiError("You are not following this user", 404);
  }

  // Deletes both accepted follows and pending requests
  await prisma.follow.delete({ where: { id: existing.id } });

  return successResponse({ username });
});
