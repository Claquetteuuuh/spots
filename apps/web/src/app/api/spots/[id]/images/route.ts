import { prisma } from "@/lib/db";
import { spotImageSchema } from "@trs/shared/validation";
import { errorResponse, successResponse, validateBody, withAuth } from "@/lib/api-utils";

/** A spot's photos, cover first. */
export const MAX_SPOT_IMAGES = 10;

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/spots/:id/images — add an uploaded photo to the spot's gallery.
 * Owner only, ten at most; it goes last.
 */
export const POST = withAuth<Ctx>(async (request, authUser, { params }) => {
  const { id } = await params;
  const input = validateBody(spotImageSchema, await request.json());

  const spot = await prisma.spot.findUnique({
    where: { id },
    select: { userId: true, images: { select: { order: true }, orderBy: { order: "desc" }, take: 1 }, _count: { select: { images: true } } },
  });
  if (!spot) return errorResponse("Spot not found", 404);
  if (spot.userId !== authUser.userId) return errorResponse("Only the owner can change the photos", 403);
  if (spot._count.images >= MAX_SPOT_IMAGES) {
    return errorResponse(`A spot holds at most ${MAX_SPOT_IMAGES} photos`, 400);
  }

  const order = (spot.images[0]?.order ?? -1) + 1;
  await prisma.spotImage.create({
    data: { spotId: id, photoUrl: input.photoUrl, photoKey: input.photoKey, order },
  });
  const images = await prisma.spotImage.findMany({ where: { spotId: id }, orderBy: { order: "asc" } });

  return successResponse(images, 201);
});
