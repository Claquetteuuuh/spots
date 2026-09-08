import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_AVATAR_SIZE_BYTES,
} from "@trs/shared/constants";
import { ApiError, successResponse, withAuth } from "@/lib/api-utils";
import { deleteFile, uploadFile } from "@/lib/storage";

export const POST = withAuth(async (request, authUser) => {
  const formData = await request.formData().catch(() => {
    throw new ApiError("Request must be multipart/form-data", 400);
  });

  const file = formData.get("avatar");

  if (!(file instanceof File)) {
    throw new ApiError("Missing 'avatar' file field", 400);
  }

  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new ApiError(
      `Unsupported file type '${file.type}'. Accepted types: ${ACCEPTED_IMAGE_TYPES.join(", ")}`,
      400,
    );
  }

  if (file.size === 0) {
    throw new ApiError("Uploaded file is empty", 400);
  }

  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    const maxMb = Math.round(MAX_AVATAR_SIZE_BYTES / (1024 * 1024));
    throw new ApiError(`File too large. Maximum size is ${maxMb}MB`, 400);
  }

  // Delete old avatar from R2 if it exists
  const currentUser = await prisma.user.findUnique({
    where: { id: authUser.userId },
    select: { avatarUrl: true },
  });

  const extension = file.type.split("/")[1] ?? "jpg";
  const avatarKey = `avatars/${authUser.userId}/${randomUUID()}.${extension}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const avatarUrl = await uploadFile(avatarKey, buffer, file.type);

  // Update user record with new avatar URL
  await prisma.user.update({
    where: { id: authUser.userId },
    data: { avatarUrl },
  });

  // Clean up old avatar in background (best effort)
  if (currentUser?.avatarUrl) {
    const oldKey = extractKeyFromUrl(currentUser.avatarUrl);
    if (oldKey) {
      deleteFile(oldKey).catch(() => {
        // Non-critical — old file stays in R2
      });
    }
  }

  return successResponse({ url: avatarUrl, key: avatarKey }, 201);
});

function extractKeyFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    // Remove leading slash
    return u.pathname.replace(/^\//, "");
  } catch {
    return null;
  }
}
