import { prisma } from "@/lib/db";
import { errorResponse, successResponse, withAuth } from "@/lib/api-utils";
import { deleteFile } from "@/lib/storage";

type Ctx = { params: Promise<{ id: string; imageId: string }> };

/**
 * DELETE /api/spots/:id/images/:imageId — take a photo out of the gallery.
 * Owner only; the last photo stays. Removing the cover hands the cover to
 * the next photo, and the stored file goes with the row.
 */
export const DELETE = withAuth<Ctx>(async (_request, authUser, { params }) => {
  const { id, imageId } = await params;

  const image = await prisma.spotImage.findUnique({
    where: { id: imageId },
    include: { spot: { select: { userId: true, photoKey: true, _count: { select: { images: true } } } } },
  });
  if (!image || image.spotId !== id) return errorResponse("Photo not found", 404);
  if (image.spot.userId !== authUser.userId) return errorResponse("Only the owner can change the photos", 403);
  if (image.spot._count.images <= 1) return errorResponse("A spot keeps at least one photo", 400);

  await prisma.spotImage.delete({ where: { id: imageId } });
  const images = await prisma.spotImage.findMany({ where: { spotId: id }, orderBy: { order: "asc" } });

  // The cover was this photo: the first one left takes over
  let cover: { photoUrl: string; photoKey: string } | null = null;
  if (image.photoKey === image.spot.photoKey && images[0]) {
    cover = { photoUrl: images[0].photoUrl, photoKey: images[0].photoKey };
    await prisma.spot.update({ where: { id }, data: cover });
  }

  // Awaited: a serverless function can be frozen as soon as it responds.
  // The row is already gone, so a storage failure is logged, not surfaced.
  try {
    await deleteFile(image.photoKey);
  } catch (error) {
    console.error(`Failed to delete R2 object ${image.photoKey}:`, error);
  }

  return successResponse({ id: imageId, images, cover });
});
