import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  ApiError,
  handleApiError,
  successResponse,
  withAuth,
} from "@/lib/api-utils";
import { uploadFile } from "@/lib/storage";
import { readPhotoUpload } from "@/lib/upload";

const PHOTO_AUTHOR_SELECT = {
  id: true,
  username: true,
  name: true,
  avatarUrl: true,
} as const;

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/spots/:id/photos — list community photos for a spot (public).
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const { searchParams } = request.nextUrl;
    const cursor = searchParams.get("cursor");
    const limit = Math.min(Number(searchParams.get("limit") ?? 20), 50);

    const photos = await prisma.spotPhoto.findMany({
      where: { spotId: id },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        user: { select: PHOTO_AUTHOR_SELECT },
      },
    });

    const hasMore = photos.length > limit;
    const items = hasMore ? photos.slice(0, limit) : photos;

    return NextResponse.json({
      data: {
        items,
        nextCursor: hasMore ? items[items.length - 1].id : null,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/spots/:id/photos — upload a community photo (auth required).
 */
export const POST = withAuth<RouteParams>(
  async (request, authUser, { params }) => {
    const { id } = await params;

    // Verify spot exists
    const spot = await prisma.spot.findUnique({ where: { id } });
    if (!spot) throw new ApiError("Spot not found", 404);

    const { image, fields } = await readPhotoUpload(request, "photo");
    const caption = fields.get("caption");

    const photoKey = `spot-photos/${id}/${authUser.userId}/${randomUUID()}.${image.extension}`;
    const photoUrl = await uploadFile(photoKey, image.buffer, image.contentType);

    const spotPhoto = await prisma.spotPhoto.create({
      data: {
        spotId: id,
        userId: authUser.userId,
        photoUrl,
        photoKey,
        caption: typeof caption === "string" ? caption.slice(0, 500) : null,
      },
      include: {
        user: { select: PHOTO_AUTHOR_SELECT },
      },
    });

    return successResponse(spotPhoto, 201);
  },
);
