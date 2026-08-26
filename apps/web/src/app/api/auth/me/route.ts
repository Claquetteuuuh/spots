import type { NextRequest } from "next/server";
import { prisma } from "@trs/db";
import { ApiError, successResponse, withAuth } from "@/lib/api-utils";
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
