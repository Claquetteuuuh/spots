import { randomUUID } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ApiError, successResponse, validateBody, withAuth } from "@/lib/api-utils";
import { deleteFiles, uploadFile } from "@/lib/storage";
import { readPhotoUpload } from "@/lib/upload";

/**
 * POST /api/upload/photo — stage a photo for a spot that is about to be
 * created. The file is compressed before it is stored; the returned key
 * is what `POST /api/spots` expects.
 */
export const POST = withAuth(async (request, authUser) => {
  const { image } = await readPhotoUpload(request, "photo");

  const photoKey = `spots/${authUser.userId}/${randomUUID()}.${image.extension}`;
  const photoUrl = await uploadFile(photoKey, image.buffer, image.contentType);

  return successResponse(
    {
      photoUrl,
      photoKey,
      width: image.width,
      height: image.height,
      bytes: image.outputBytes,
    },
    201,
  );
});

const discardSchema = z.object({
  keys: z.array(z.string().min(1).max(300)).min(1).max(20),
});

/**
 * DELETE /api/upload/photo — throw away staged photos that will never be
 * attached to a spot (the user cancelled, or creating the spot failed
 * after the upload succeeded). Without this every abandoned draft would
 * leave its photos in the bucket forever.
 *
 * Only keys under the caller's own `spots/<userId>/` prefix are accepted,
 * and a key some spot already references is left alone.
 */
export const DELETE = withAuth(async (request, authUser) => {
  const body = await request.json().catch(() => {
    throw new ApiError("Request body must be valid JSON", 400);
  });
  const { keys } = validateBody(discardSchema, body);

  const ownPrefix = `spots/${authUser.userId}/`;
  const foreign = keys.filter(
    (key) => !key.startsWith(ownPrefix) || key.includes(".."),
  );
  if (foreign.length > 0) {
    throw new ApiError("You can only discard your own uploads", 403);
  }

  const [asCover, asImage] = await Promise.all([
    prisma.spot.findMany({
      where: { photoKey: { in: keys } },
      select: { photoKey: true },
    }),
    prisma.spotImage.findMany({
      where: { photoKey: { in: keys } },
      select: { photoKey: true },
    }),
  ]);
  const inUse = new Set([...asCover, ...asImage].map((row) => row.photoKey));
  const orphaned = keys.filter((key) => !inUse.has(key));

  await deleteFiles(orphaned);

  return successResponse({ deleted: orphaned });
});
