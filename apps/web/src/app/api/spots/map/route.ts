import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { mapPinsQuerySchema } from "@trs/shared/validation";
import {
  haversineKm,
  intersectBounds,
  radiusToBounds,
  type LatLng,
  type MapBounds,
  type MapPin,
} from "@trs/shared/map";
import { successResponse, validateBody, withAuth } from "@/lib/api-utils";

/** Only what a marker, its filters and its preview card need — no author, no images. */
const PIN_SELECT = {
  id: true,
  latitude: true,
  longitude: true,
  title: true,
  photoUrl: true,
  city: true,
  userId: true,
  colors: true,
  compositions: true,
  accessibility: true,
} as const;

const PIN_ORDER = [{ createdAt: "desc" as const }, { id: "desc" as const }];

/**
 * Lightweight pins inside a viewport. The viewer's own spots always come
 * first and are never crowded out: followed users' spots only fill
 * whatever budget is left. Composition, accessibility and "around me"
 * filters narrow both queries; colour families are matched on the client.
 */
export const GET = withAuth(async (request, authUser) => {
  const q = validateBody(mapPinsQuerySchema, Object.fromEntries(request.nextUrl.searchParams));

  // "Around me" shrinks the box to the circle's bounding square (cheap,
  // indexed); the exact distance is checked on the rows that come back.
  const near: LatLng | null =
    q.nearLat !== undefined && q.nearLng !== undefined && q.radiusKm !== undefined
      ? { latitude: q.nearLat, longitude: q.nearLng }
      : null;
  const viewport: MapBounds = { swLat: q.swLat, swLng: q.swLng, neLat: q.neLat, neLng: q.neLng };
  const box = near ? intersectBounds(viewport, radiusToBounds(near, q.radiusKm!)) : viewport;
  if (!box) return successResponse({ items: [], truncated: false });

  const where = {
    latitude: { gte: box.swLat, lte: box.neLat },
    longitude: { gte: box.swLng, lte: box.neLng },
    ...(q.compositions?.length ? { compositions: { hasSome: q.compositions } } : {}),
    ...(q.accessibility?.length ? { accessibility: { in: q.accessibility } } : {}),
  };

  const [ownRows, following] = await Promise.all([
    q.scope === "following"
      ? Promise.resolve([])
      : prisma.spot.findMany({
          where: { userId: authUser.userId, ...where },
          select: PIN_SELECT,
          orderBy: PIN_ORDER,
          take: q.limit,
        }),
    q.scope === "mine"
      ? Promise.resolve([])
      : prisma.follow.findMany({
          where: { followerId: authUser.userId, status: "ACCEPTED" },
          select: { followingId: true },
        }),
  ]);

  const rows: MapPin[] = ownRows.map((r) => ({ ...r, isOwn: true }));

  const remaining = q.limit - rows.length;
  if (following.length > 0 && remaining > 0) {
    const theirs = await prisma.spot.findMany({
      where: {
        userId: { in: following.map((f) => f.followingId) },
        visibility: "FOLLOWERS",
        ...where,
      },
      select: PIN_SELECT,
      orderBy: PIN_ORDER,
      take: remaining,
    });
    rows.push(...theirs.map((r) => ({ ...r, isOwn: false })));
  }

  // Truncation is about what the database handed back, before the corners
  // of the square outside the circle are trimmed.
  const truncated = rows.length >= q.limit;
  const items = near ? rows.filter((p) => haversineKm(near, p) <= q.radiusKm!) : rows;

  // Clients poll an open map; when nothing moved, answer with a 304 and no
  // body. `no-cache` means "always revalidate", never "never cache".
  const body = { items, truncated };
  const etag = `W/"${createHash("sha1").update(JSON.stringify(body)).digest("base64url")}"`;
  const headers = { ETag: etag, "Cache-Control": "private, no-cache" };
  if (request.headers.get("if-none-match") === etag) {
    return new NextResponse(null, { status: 304, headers });
  }
  const res = successResponse(body);
  for (const [k, v] of Object.entries(headers)) res.headers.set(k, v);
  return res;
});
