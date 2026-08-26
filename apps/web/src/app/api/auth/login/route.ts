import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@trs/db";
import { loginSchema } from "@trs/shared/validation";
import { ApiError, handleApiError, successResponse, validateBody } from "@/lib/api-utils";
import { signAccessToken, signRefreshToken } from "@/lib/auth";
import { toPublicUser } from "@/lib/serializers";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
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
