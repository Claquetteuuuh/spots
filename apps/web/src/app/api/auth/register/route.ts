import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma, Prisma } from "@trs/db";
import { registerSchema } from "@trs/shared/validation";
import { ApiError, handleApiError, successResponse, validateBody } from "@/lib/api-utils";
import { signAccessToken, signRefreshToken } from "@/lib/auth";
import { toPublicUser } from "@/lib/serializers";

const BCRYPT_ROUNDS = 12;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json().catch(() => {
      throw new ApiError("Request body must be valid JSON", 400);
    });

    const { email, password, username, name } = validateBody(registerSchema, body);

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
      select: { email: true, username: true },
    });

    if (existing) {
      if (existing.email === email) {
        throw new ApiError("An account with this email already exists", 409);
      }
      throw new ApiError("This username is already taken", 409);
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        username,
        name,
        provider: "EMAIL",
      },
    });

    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });
    const refreshToken = signRefreshToken({ userId: user.id });

    return successResponse(
      { user: toPublicUser(user), accessToken, refreshToken },
      201
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = (error.meta?.target as string[] | undefined) ?? [];
      if (target.includes("email")) {
        return handleApiError(new ApiError("An account with this email already exists", 409));
      }
      if (target.includes("username")) {
        return handleApiError(new ApiError("This username is already taken", 409));
      }
      return handleApiError(new ApiError("A user with these details already exists", 409));
    }
    return handleApiError(error);
  }
}
