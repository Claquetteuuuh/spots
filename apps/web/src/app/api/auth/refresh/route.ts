import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ApiError, errorResponse, handleApiError, successResponse } from "@/lib/api-utils";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "@/lib/auth";
import { toPublicUser } from "@/lib/serializers";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// 30 refresh attempts per 15 minutes per IP
const REFRESH_RATE_LIMIT = 30;
const REFRESH_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const ip = getClientIp(request);
    const limit = rateLimit(`refresh:${ip}`, REFRESH_RATE_LIMIT, REFRESH_WINDOW_MS);
    if (!limit.allowed) {
      return errorResponse("Too many requests. Please try again later.", 429);
    }
    const body = await request.json().catch(() => {
      throw new ApiError("Request body must be valid JSON", 400);
    });

    const { refreshToken } = body as { refreshToken?: string };

    if (!refreshToken || typeof refreshToken !== "string") {
      throw new ApiError("Missing refresh token", 400);
    }

    const payload = verifyRefreshToken(refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new ApiError("User not found", 401);
    }

    const newAccessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });
    const newRefreshToken = signRefreshToken({ userId: user.id });

    return successResponse({
      user: toPublicUser(user),
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return handleApiError(error);
    }
    // AuthTokenError from verifyRefreshToken → treat as 401
    if (
      error instanceof Error &&
      error.name === "AuthTokenError"
    ) {
      return handleApiError(new ApiError("Invalid or expired refresh token", 401));
    }
    return handleApiError(error);
  }
}
