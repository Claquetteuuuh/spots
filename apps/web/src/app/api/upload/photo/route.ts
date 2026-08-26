import { randomUUID } from "node:crypto";
import { ACCEPTED_IMAGE_TYPES, MAX_PHOTO_SIZE_BYTES } from "@trs/shared/constants";
import { ApiError, successResponse, withAuth } from "@/lib/api-utils";
import { uploadFile } from "@/lib/storage";

export const POST = withAuth(async (request, authUser) => {
  const formData = await request.formData().catch(() => {
    throw new ApiError("Request must be multipart/form-data", 400);
  });

  const file = formData.get("photo");

  if (!(file instanceof File)) {
    throw new ApiError("Missing 'photo' file field", 400);
  }

  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new ApiError(
      `Unsupported file type '${file.type}'. Accepted types: ${ACCEPTED_IMAGE_TYPES.join(", ")}`,
      400
    );
  }

  if (file.size === 0) {
    throw new ApiError("Uploaded file is empty", 400);
  }

  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    const maxMb = Math.round(MAX_PHOTO_SIZE_BYTES / (1024 * 1024));
    throw new ApiError(`File too large. Maximum size is ${maxMb}MB`, 400);
  }

  const extension = file.type.split("/")[1] ?? "jpg";
  const photoKey = `spots/${authUser.userId}/${randomUUID()}.${extension}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const photoUrl = await uploadFile(photoKey, buffer, file.type);

  return successResponse({ photoUrl, photoKey }, 201);
});
