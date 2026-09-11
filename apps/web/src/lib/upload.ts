import type { NextRequest } from "next/server";
import { ACCEPTED_IMAGE_TYPES, MAX_PHOTO_SIZE_BYTES } from "@trs/shared/constants";
import { ApiError } from "./api-utils";
import { compressImage, type CompressedImage } from "./image";

export interface PhotoUpload {
  /** The photo, already downscaled and re-encoded — the only thing stored. */
  image: CompressedImage;
  /** The rest of the multipart body, for routes that take a caption etc. */
  fields: FormData;
}

/**
 * Read the `field` file out of a multipart request, validate it, and run it
 * through the compression pipeline. Every photo upload route goes through
 * here so nothing can reach the bucket uncompressed.
 */
export async function readPhotoUpload(
  request: NextRequest,
  field: string,
): Promise<PhotoUpload> {
  const fields = await request.formData().catch(() => {
    throw new ApiError("Request must be multipart/form-data", 400);
  });

  const file = fields.get(field);

  if (!(file instanceof File)) {
    throw new ApiError(`Missing '${field}' file field`, 400);
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

  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    const maxMb = Math.round(MAX_PHOTO_SIZE_BYTES / (1024 * 1024));
    throw new ApiError(`File too large. Maximum size is ${maxMb}MB`, 400);
  }

  const original = Buffer.from(await file.arrayBuffer());
  const image = await compressImage(original, file.type);

  return { image, fields };
}
