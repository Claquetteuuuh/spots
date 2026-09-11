import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { oauthSchema } from "@trs/shared/validation";
import { ApiError, handleApiError, successResponse, validateBody } from "@/lib/api-utils";
import { signAccessToken, signRefreshToken } from "@/lib/auth";
import { toPublicUser } from "@/lib/serializers";
import { verifyGoogleIdToken } from "@/lib/google-auth";

/**
 * Generate a unique username from a display name.
 * Appends random digits if the base slug is taken.
 */
async function generateUsername(name: string): Promise<string> {
  let base = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 15) || "user";

  // Ensure the base meets the minimum length (3 chars) required by validation
  while (base.length < 3) {
    base += Math.floor(Math.random() * 10).toString();
  }

  // Try the base name first
  const existing = await prisma.user.findUnique({ where: { username: base } });
  if (!existing) return base;

  // Append random digits until we find something free
  for (let i = 0; i < 10; i++) {
    const suffix = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    const candidate = `${base}${suffix}`;
    const taken = await prisma.user.findUnique({ where: { username: candidate } });
    if (!taken) return candidate;
  }

  // Fallback: UUID-based
  const { randomUUID } = await import("node:crypto");
  return `user_${randomUUID().slice(0, 8)}`;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json().catch(() => {
      throw new ApiError("Request body must be valid JSON", 400);
    });

    const { token, provider } = validateBody(oauthSchema, body);

    if (provider !== "GOOGLE") {
      throw new ApiError("This endpoint only handles Google authentication", 400);
    }

    // Verify the Google ID token
    let googleUser;
    try {
      googleUser = await verifyGoogleIdToken(token);
    } catch {
      throw new ApiError("Invalid or expired Google token", 401);
    }

    if (!googleUser.email_verified) {
      throw new ApiError("Google account email is not verified", 403);
    }

    // Look for existing user: first by Google provider ID, then by email
    let user = await prisma.user.findFirst({
      where: { provider: "GOOGLE", providerId: googleUser.sub },
    });

    if (!user) {
      // Check if a user with this email exists (registered via email/password)
      user = await prisma.user.findUnique({
        where: { email: googleUser.email },
      });

      if (user) {
        // Link the Google account to the existing user
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            provider: "GOOGLE",
            providerId: googleUser.sub,
            avatarUrl: user.avatarUrl ?? googleUser.picture ?? null,
          },
        });
      } else {
        // Create a brand-new user
        const username = await generateUsername(googleUser.name);

        user = await prisma.user.create({
          data: {
            email: googleUser.email,
            username,
            name: googleUser.name,
            avatarUrl: googleUser.picture ?? null,
            provider: "GOOGLE",
            providerId: googleUser.sub,
          },
        });
      }
    }

    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });
    const refreshToken = signRefreshToken({ userId: user.id });

    return successResponse(
      { user: toPublicUser(user), accessToken, refreshToken },
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
