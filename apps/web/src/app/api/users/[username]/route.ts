import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@trs/db";
import { ApiError, handleApiError, successResponse } from "@/lib/api-utils";
import { toUserProfile } from "@/lib/serializers";

interface RouteParams {
  params: Promise<{ username: string }>;
}

export async function GET(
  _request: NextRequest,
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

    return successResponse(toUserProfile(user));
  } catch (error) {
    return handleApiError(error);
  }
}
