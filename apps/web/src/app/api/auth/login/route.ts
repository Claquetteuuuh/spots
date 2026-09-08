import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { loginSchema } from "@trs/shared/validation";
import { ApiError, errorResponse, handleApiError, successResponse, validateBody } from "@/lib/api-utils";
import { signAccessToken, signRefreshToken } from "@/lib/auth";
import { toPublicUser } from "@/lib/serializers";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// 10 login attempts per 15 minutes per IP
const LOGIN_RATE_LIMIT = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const ip = getClientIp(request);
    const limit = rateLimit(`login:${ip}`, LOGIN_RATE_LIMIT, LOGIN_WINDOW_MS);
    if (!limit.allowed) {
      return errorResponse("Too many login attempts. Please try again later.", 429);
    }
    const body = await request.json().catch(() => {
      throw new ApiError("Request body must be valid JSON", 400);
    });

    const { email, password } = validateBody(loginSchema, body);

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.passwordHash) {
      throw new ApiError("Invalid email or password", 401);
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new ApiError("Invalid email or password", 401);
    }

    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });
    const refreshToken = signRefreshToken({ userId: user.id });

    return successResponse({ user: toPublicUser(user), accessToken, refreshToken });
  } catch (error) {
    return handleApiError(error);
  }
}
