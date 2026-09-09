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

    // Count only accepted followers/following (not pending requests)
    const [acceptedFollowersCount, acceptedFollowingCount] = await Promise.all([
      prisma.follow.count({
        where: { followingId: user.id, status: "ACCEPTED" },
      }),
      prisma.follow.count({
        where: { followerId: user.id, status: "ACCEPTED" },
      }),
    ]);

    // Override counts with accepted-only
    const profileWithCounts = {
      ...profile,
      followerCount: acceptedFollowersCount,
      followingCount: acceptedFollowingCount,
    };

    // If the viewer is authenticated, check follow status
    const viewer = await getUserFromRequest(request);
    let isFollowing = false;
    let followStatus: "ACCEPTED" | "PENDING" | null = null;

    if (viewer && viewer.userId !== user.id) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: viewer.userId,
            followingId: user.id,
          },
        },
        select: { status: true },
      });
      followStatus = follow ? (follow.status as "ACCEPTED" | "PENDING") : null;
      isFollowing = follow?.status === "ACCEPTED";
    }

    return successResponse({ ...profileWithCounts, isFollowing, followStatus });
  } catch (error) {
    return handleApiError(error);
  }
}
