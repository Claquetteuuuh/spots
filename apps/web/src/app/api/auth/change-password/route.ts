import type { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { changePasswordSchema } from "@trs/shared/validation";
import { ApiError, successResponse, validateBody, withAuth } from "@/lib/api-utils";

export const POST = withAuth(async (request: NextRequest, authUser) => {
  const body = await request.json();
  const { currentPassword, newPassword } = validateBody(changePasswordSchema, body);

  const user = await prisma.user.findUnique({
    where: { id: authUser.userId },
    select: { passwordHash: true, provider: true },
  });

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  // OAuth-only users cannot change password (they don't have one)
  if (!user.passwordHash) {
    throw new ApiError("Password change is not available for OAuth accounts", 400);
  }

  const passwordMatches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!passwordMatches) {
    throw new ApiError("Current password is incorrect", 401);
  }

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(newPassword, salt);

  await prisma.user.update({
    where: { id: authUser.userId },
    data: { passwordHash },
  });

  return successResponse({ changed: true });
});
