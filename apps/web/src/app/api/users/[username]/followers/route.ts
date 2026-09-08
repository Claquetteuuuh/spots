import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ApiError, handleApiError, successResponse } from "@/lib/api-utils";
import { toPublicUser } from "@/lib/serializers";

interface RouteParams {
  params: Promise<{ username: string }>;
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const { username } = await params;

    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!user) {
      throw new ApiError("User not found", 404);
    }

    const follows = await prisma.follow.findMany({
      where: { followingId: user.id },
      include: { follower: true },
      orderBy: { createdAt: "desc" },
    });

    const followers = follows.map((f) => toPublicUser(f.follower));

    return successResponse(followers);
  } catch (error) {
    return handleApiError(error);
  }
}
