import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { Prisma, prisma } from "@/lib/db";
import { createSpotSchema, spotQuerySchema } from "@trs/shared/validation";
import {
  ApiError,
  handleApiError,
  successResponse,
  validateBody,
  withAuth,
} from "@/lib/api-utils";
import { getUserFromRequest } from "@/lib/auth";
import { reverseGeocode } from "@/lib/geocode";
import { paginate } from "@/lib/pagination";

const SPOT_AUTHOR_SELECT = {
  id: true,
  username: true,
  name: true,
  avatarUrl: true,
} as const;

/**
 * `createSpotSchema` (from `@trs/shared`) validates the photography
 * metadata shared with `updateSpotSchema`, but a spot always needs a photo
 * that was already uploaded via `/api/upload/photo` — so we extend it with
 * the resulting object storage reference for the create request only.
 *
 * Accepts EITHER a `photos` array (multi-photo) OR `photoUrl`+`photoKey`
 * (single-photo, backward compatible).
 */
const createSpotRequestSchema = createSpotSchema.extend({
  photoUrl: z.string().url().optional(),
  photoKey: z.string().min(1).optional(),
  photos: z.array(z.object({ url: z.string().url(), key: z.string().min(1) })).min(1).max(10).optional(),
}).refine(
  (data) => (data.photos && data.photos.length > 0) || (data.photoUrl && data.photoKey),
  { message: "Either photos array or photoUrl+photoKey is required" }
);

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Privacy: spots are only visible to the owner and their accepted followers
    const viewer = await getUserFromRequest(request);

    if (!viewer) {
      return successResponse({ items: [], nextCursor: null });
    }

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const { cursor, limit, userId, swLat, swLng, neLat, neLng } = validateBody(
      spotQuerySchema,
      searchParams
    );

    // Build the list of user IDs whose spots this viewer can see
    const acceptedFollows = await prisma.follow.findMany({
      where: { followerId: viewer.userId, status: "ACCEPTED" },
      select: { followingId: true },
    });
    const allowedUserIds = [
      viewer.userId,
      ...acceptedFollows.map((f) => f.followingId),
    ];

    const where: Prisma.SpotWhereInput = {};

    if (userId) {
      // Only show this user's spots if they are in the allowed list
      if (!allowedUserIds.includes(userId)) {
        return successResponse({ items: [], nextCursor: null });
      }
      where.userId = userId;
    } else {
      where.userId = { in: allowedUserIds };
    }

    // PRIVATE spots are only visible to their owner
    where.OR = [
      { userId: viewer.userId },
      { visibility: "FOLLOWERS" },
    ];

    if (
      swLat !== undefined &&
      swLng !== undefined &&
      neLat !== undefined &&
      neLng !== undefined
    ) {
      where.latitude = { gte: swLat, lte: neLat };
      where.longitude = { gte: swLng, lte: neLng };
    }

    const rows = await prisma.spot.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        user: { select: SPOT_AUTHOR_SELECT },
        images: { orderBy: { order: "asc" } },
      },
    });

    return successResponse(paginate(rows, limit));
  } catch (error) {
    return handleApiError(error);
  }
}

export const POST = withAuth(async (request, authUser) => {
  const body = await request.json().catch(() => {
    throw new ApiError("Request body must be valid JSON", 400);
  });

  const input = validateBody(createSpotRequestSchema, body);

  // Normalise photos: multi-photo array takes precedence, single-photo
  // fields are the backward-compatible fallback.
  const photos: { url: string; key: string }[] = input.photos && input.photos.length > 0
    ? input.photos
    : [{ url: input.photoUrl!, key: input.photoKey! }];

  const primaryPhoto = photos[0];

  let address: string | null = null;
  let city: string | null = null;
  let country: string | null = null;

  try {
    const geo = await reverseGeocode(input.latitude, input.longitude);
    address = geo.address;
    city = geo.city;
    country = geo.country;
  } catch (error) {
    // Reverse geocoding is a nice-to-have enrichment — don't fail spot
    // creation just because the geocoding provider is unavailable.
    console.error("Reverse geocoding failed:", error);
  }

  const spot = await prisma.spot.create({
    data: {
      userId: authUser.userId,
      latitude: input.latitude,
      longitude: input.longitude,
      address,
      city,
      country,
      photoUrl: primaryPhoto.url,
      photoKey: primaryPhoto.key,
      title: input.title,
      description: input.description,
      isFree: input.isFree,
      priceInfo: input.priceInfo,
      visibility: input.visibility,
      customComposition: input.customComposition,
      colors: input.colors,
      compositions: input.compositions,
      tags: input.tags,
      images: {
        create: photos.map((p, i) => ({
          photoUrl: p.url,
          photoKey: p.key,
          order: i,
        })),
      },
    },
    include: {
      user: { select: SPOT_AUTHOR_SELECT },
      images: { orderBy: { order: "asc" } },
    },
  });

  return successResponse(spot, 201);
});
