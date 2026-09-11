import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { userSearchSchema } from "@trs/shared/validation";
import { handleApiError, successResponse, validateBody } from "@/lib/api-utils";
import { getUserFromRequest } from "@/lib/auth";

type FollowStatus = "ACCEPTED" | "PENDING";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const { q, limit } = validateBody(userSearchSchema, searchParams);

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: q, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        username: true,
        name: true,
        avatarUrl: true,
        bio: true,
        isPrivate: true,
      },
      orderBy: { username: "asc" },
      take: limit,
    });

    // Like the profile endpoint, an authenticated viewer also learns where
    // they stand with each result, so the list can offer follow/unfollow
    // inline. One query covers the whole page of results.
    const viewer = await getUserFromRequest(request);
    const statusByUserId = new Map<string, FollowStatus>();

    if (viewer && users.length > 0) {
      const follows = await prisma.follow.findMany({
        where: {
          followerId: viewer.userId,
          followingId: { in: users.map((user) => user.id) },
        },
        select: { followingId: true, status: true },
      });
      for (const follow of follows) {
        statusByUserId.set(follow.followingId, follow.status as FollowStatus);
      }
    }

    const results = users.map((user) => {
      const followStatus = statusByUserId.get(user.id) ?? null;
      return {
        ...user,
        isFollowing: followStatus === "ACCEPTED",
        followStatus,
      };
    });

    return successResponse(results);
  } catch (error) {
    return handleApiError(error);
  }
}
