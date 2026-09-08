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
 */
const createSpotRequestSchema = createSpotSchema.extend({
  photoUrl: z.string().url(),
  photoKey: z.string().min(1),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const { cursor, limit, userId, swLat, swLng, neLat, neLng } = validateBody(
      spotQuerySchema,
      searchParams
    );

    const where: Prisma.SpotWhereInput = {};

    if (userId) {
      where.userId = userId;
    }

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
      include: { user: { select: SPOT_AUTHOR_SELECT } },
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
      photoUrl: input.photoUrl,
      photoKey: input.photoKey,
      title: input.title,
      description: input.description,
      isFree: input.isFree,
      priceInfo: input.priceInfo,
      colors: input.colors,
      compositions: input.compositions,
      tags: input.tags,
    },
    include: { user: { select: SPOT_AUTHOR_SELECT } },
  });

  return successResponse(spot, 201);
});
