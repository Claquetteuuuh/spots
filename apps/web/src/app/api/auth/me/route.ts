import type { NextRequest } from "next/server";
import { Prisma, prisma } from "@/lib/db";
import { updateProfileSchema } from "@trs/shared/validation";
import { ApiError, successResponse, validateBody, withAuth } from "@/lib/api-utils";
import { toUserProfile } from "@/lib/serializers";

export const GET = withAuth(async (_request: NextRequest, authUser) => {
  const user = await prisma.user.findUnique({
    where: { id: authUser.userId },
    include: {
      _count: {
        select: { spots: true, followers: true, following: true },
      },
    },
  });

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  return successResponse(toUserProfile(user));
});

export const PATCH = withAuth(async (request: NextRequest, authUser) => {
  const body = await request.json();
  const data = validateBody(updateProfileSchema, body);

  // If switching from private to public, auto-accept all pending follow requests
  if (data.isPrivate === false) {
    const currentUser = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: { isPrivate: true },
    });
    if (currentUser?.isPrivate) {
      await prisma.follow.updateMany({
        where: { followingId: authUser.userId, status: "PENDING" },
        data: { status: "ACCEPTED" },
      });
    }
  }

  try {
    const user = await prisma.user.update({
      where: { id: authUser.userId },
      data,
      include: {
        _count: {
          select: { spots: true, followers: true, following: true },
        },
      },
    });

    return successResponse(toUserProfile(user));
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = (error.meta?.target as string[]) ?? [];
      if (target.includes("email")) {
        throw new ApiError("Email is already in use", 409);
      }
      throw new ApiError("Username is already taken", 409);
    }
    throw error;
  }
});
