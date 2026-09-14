import type { NextRequest } from "next/server";
import { ACCEPTED_IMAGE_TYPES, MAX_PHOTO_SIZE_BYTES } from "@trs/shared/constants";
import { MAX_POST_PHOTOS } from "@trs/shared/mentions";
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

  const image = await readImage(file, field);

  return { image, fields };
}

/**
 * The same, for a field a photographer may fill several times over: every
 * photo of one post, in the order they chose them, each one compressed on
 * its way through. At least one, never more than `MAX_POST_PHOTOS`.
 */
export async function readPhotoUploads(
  request: NextRequest,
  field: string,
): Promise<{ images: CompressedImage[]; fields: FormData }> {
  const fields = await request.formData().catch(() => {
    throw new ApiError("Request must be multipart/form-data", 400);
  });

  const files = fields.getAll(field);
  if (files.length === 0) throw new ApiError(`Missing '${field}' file field`, 400);
  if (files.length > MAX_POST_PHOTOS) {
    throw new ApiError(`Too many photos. At most ${MAX_POST_PHOTOS} per post`, 400);
  }

  const images: CompressedImage[] = [];
  for (const file of files) {
    if (!(file instanceof File)) throw new ApiError(`Missing '${field}' file field`, 400);
    images.push(await readImage(file, field));
  }

  return { images, fields };
}

/** Validate one file and hand back what should be stored for it. */
async function readImage(file: File, field: string): Promise<CompressedImage> {
  if (!(file instanceof File)) {
    throw new ApiError(`Missing '${field}' file field`, 400);
  }

  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new ApiError(
      `Unsupported file type '${file.type}'. Accepted types: ${ACCEPTED_IMAGE_TYPES.join(", ")}`,
      400,
    );
  }

  if (file.size === 0) throw new ApiError("Uploaded file is empty", 400);

  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    const maxMb = Math.round(MAX_PHOTO_SIZE_BYTES / (1024 * 1024));
    throw new ApiError(`File too large. Maximum size is ${maxMb}MB`, 400);
  }

  const original = Buffer.from(await file.arrayBuffer());
  return compressImage(original, file.type);
}
