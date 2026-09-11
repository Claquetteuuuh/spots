import type { NextRequest } from "next/server";
import { Prisma, prisma } from "@/lib/db";
import { updateProfileSchema } from "@trs/shared/validation";
import { ApiError, successResponse, validateBody, withAuth } from "@/lib/api-utils";
import { toUserProfile } from "@/lib/serializers";
import { deleteFile, keyFromUrl } from "@/lib/storage";

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

  const avatarChanges = data.avatarUrl !== undefined;

  // The current row is only needed to react to a change: privacy going
  // public, or an avatar being replaced.
  const current =
    data.isPrivate === false || avatarChanges
      ? await prisma.user.findUnique({
          where: { id: authUser.userId },
          select: { isPrivate: true, avatarUrl: true },
        })
      : null;

  // If switching from private to public, auto-accept all pending follow requests
  if (data.isPrivate === false && current?.isPrivate) {
    await prisma.follow.updateMany({
      where: { followingId: authUser.userId, status: "PENDING" },
      data: { status: "ACCEPTED" },
    });
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

    // Avatars used to be uploaded to the bucket. Now that they are
    // generated, a user picking a DiceBear avatar (or clearing theirs)
    // is the moment their old file stops being referenced — drop it.
    if (avatarChanges && current?.avatarUrl !== data.avatarUrl) {
      const previousKey = keyFromUrl(current?.avatarUrl);
      if (previousKey) {
        try {
          await deleteFile(previousKey);
        } catch (error) {
          console.error(`Failed to delete R2 object ${previousKey}:`, error);
        }
      }
    }

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
