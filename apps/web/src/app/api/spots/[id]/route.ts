import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { updateSpotSchema } from "@trs/shared/validation";
import {
  ApiError,
  handleApiError,
  successResponse,
  validateBody,
  withAuth,
} from "@/lib/api-utils";
import { getUserFromRequest } from "@/lib/auth";
import { reverseGeocode } from "@/lib/geocode";
import { deleteFile } from "@/lib/storage";

const SPOT_AUTHOR_SELECT = {
  id: true,
  username: true,
  name: true,
  avatarUrl: true,
} as const;

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;

    const spot = await prisma.spot.findUnique({
      where: { id },
      include: {
        user: { select: SPOT_AUTHOR_SELECT },
        images: { orderBy: { order: "asc" } },
      },
    });

    if (!spot) {
      throw new ApiError("Spot not found", 404);
    }

    // Privacy: spots are only visible to the owner and their accepted followers
    const viewer = await getUserFromRequest(request);
    if (!viewer) {
      throw new ApiError("Spot not found", 404);
    }

    if (spot.userId !== viewer.userId) {
      // PRIVATE spots are only visible to the owner
      if (spot.visibility === "PRIVATE") {
        throw new ApiError("Spot not found", 404);
      }

      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: viewer.userId,
            followingId: spot.userId,
          },
        },
        select: { status: true },
      });

      if (follow?.status !== "ACCEPTED") {
        throw new ApiError("Spot not found", 404);
      }
    }

    return successResponse(spot);
  } catch (error) {
    return handleApiError(error);
  }
}

export const PATCH = withAuth<RouteParams>(async (request, authUser, { params }) => {
  const { id } = await params;

  const existing = await prisma.spot.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError("Spot not found", 404);
  }
  if (existing.userId !== authUser.userId) {
    throw new ApiError("You do not have permission to edit this spot", 403);
  }

  const body = await request.json().catch(() => {
    throw new ApiError("Request body must be valid JSON", 400);
  });

  const input = validateBody(updateSpotSchema, body);

  const locationChanged =
    input.latitude !== undefined &&
    input.longitude !== undefined &&
    (input.latitude !== existing.latitude || input.longitude !== existing.longitude);

  let address = existing.address;
  let city = existing.city;
  let country = existing.country;

  if (locationChanged && input.latitude !== undefined && input.longitude !== undefined) {
    try {
      const geo = await reverseGeocode(input.latitude, input.longitude);
      address = geo.address;
      city = geo.city;
      country = geo.country;
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
    }
  }

  const spot = await prisma.spot.update({
    where: { id },
    data: {
      ...input,
      ...(input.tags ? { tags: input.tags.map((t: string) => t.toLowerCase()) } : {}),
      address,
      city,
      country,
    },
    include: { user: { select: SPOT_AUTHOR_SELECT } },
  });

  return successResponse(spot);
});

export const DELETE = withAuth<RouteParams>(async (_request, authUser, { params }) => {
  const { id } = await params;

  const existing = await prisma.spot.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError("Spot not found", 404);
  }
  if (existing.userId !== authUser.userId) {
    throw new ApiError("You do not have permission to delete this spot", 403);
  }

  await prisma.spot.delete({ where: { id } });

  // Clean up photo from R2 — fire-and-forget so the API response isn't delayed
  deleteFile(existing.photoKey).catch((err) => {
    console.error(`Failed to delete R2 object ${existing.photoKey}:`, err);
  });

  return successResponse({ id });
});
