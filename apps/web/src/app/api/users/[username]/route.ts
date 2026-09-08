import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ApiError, handleApiError, successResponse } from "@/lib/api-utils";
import { getUserFromRequest } from "@/lib/auth";
import { toUserProfile } from "@/lib/serializers";

interface RouteParams {
  params: Promise<{ username: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { username } = await params;

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        _count: {
          select: { spots: true, followers: true, following: true },
        },
      },
    });

    if (!user) {
      throw new ApiError("User not found", 404);
    }

    const profile = toUserProfile(user);

    // If the viewer is authenticated, check if they follow this user
    const viewer = await getUserFromRequest(request);
    let isFollowing = false;

    if (viewer && viewer.userId !== user.id) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: viewer.userId,
            followingId: user.id,
          },
        },
        select: { id: true },
      });
      isFollowing = !!follow;
    }

    return successResponse({ ...profile, isFollowing });
  } catch (error) {
    return handleApiError(error);
  }
}
