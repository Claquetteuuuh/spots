import { prisma } from "@/lib/db";
import { ApiError, successResponse, withAuth } from "@/lib/api-utils";
import { deleteFile } from "@/lib/storage";

interface RouteParams {
  params: Promise<{ id: string; photoId: string }>;
}

/**
 * DELETE /api/spots/:id/photos/:photoId — remove a community photo.
 *
 * The photo's author can take it back; the spot's owner can remove
 * anything posted under their spot. The stored file goes with the row.
 */
export const DELETE = withAuth<RouteParams>(
  async (_request, authUser, { params }) => {
    const { id, photoId } = await params;

    const photo = await prisma.spotPhoto.findUnique({
      where: { id: photoId },
      include: { spot: { select: { userId: true } } },
    });

    if (!photo || photo.spotId !== id) {
      throw new ApiError("Photo not found", 404);
    }

    const isAuthor = photo.userId === authUser.userId;
    const isSpotOwner = photo.spot.userId === authUser.userId;
    if (!isAuthor && !isSpotOwner) {
      throw new ApiError("You do not have permission to delete this photo", 403);
    }

    await prisma.spotPhoto.delete({ where: { id: photoId } });

    // Awaited: a serverless function can be frozen as soon as it responds,
    // and a fire-and-forget delete would leave the file behind. The row is
    // already gone, so a storage failure is logged, not surfaced.
    try {
      await deleteFile(photo.photoKey);
    } catch (error) {
      console.error(`Failed to delete R2 object ${photo.photoKey}:`, error);
    }

    return successResponse({ id: photoId });
  },
);
