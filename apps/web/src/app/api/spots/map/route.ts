import { prisma } from "@/lib/db";
import { mapPinsQuerySchema } from "@trs/shared/validation";
import type { MapPin } from "@trs/shared/map";
import { successResponse, validateBody, withAuth } from "@/lib/api-utils";

/** Only what a marker and its preview card need — no author, no images. */
const PIN_SELECT = {
  id: true,
  latitude: true,
  longitude: true,
  title: true,
  photoUrl: true,
  city: true,
  userId: true,
} as const;

const PIN_ORDER = [{ createdAt: "desc" as const }, { id: "desc" as const }];

/**
 * Lightweight pins inside a viewport. The viewer's own spots always come
 * first and are never crowded out: followed users' spots only fill
 * whatever budget is left.
 */
export const GET = withAuth(async (request, authUser) => {
  const q = validateBody(mapPinsQuerySchema, Object.fromEntries(request.nextUrl.searchParams));

  const inBox = {
    latitude: { gte: q.swLat, lte: q.neLat },
    longitude: { gte: q.swLng, lte: q.neLng },
  };

  const [ownRows, following] = await Promise.all([
    q.scope === "following"
      ? Promise.resolve([])
      : prisma.spot.findMany({
          where: { userId: authUser.userId, ...inBox },
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

  const items: MapPin[] = ownRows.map((r) => ({ ...r, isOwn: true }));

  const remaining = q.limit - items.length;
  if (following.length > 0 && remaining > 0) {
    const rows = await prisma.spot.findMany({
      where: {
        userId: { in: following.map((f) => f.followingId) },
        visibility: "FOLLOWERS",
        ...inBox,
      },
      select: PIN_SELECT,
      orderBy: PIN_ORDER,
      take: remaining,
    });
    items.push(...rows.map((r) => ({ ...r, isOwn: false })));
  }

  return successResponse({ items, truncated: items.length >= q.limit });
});
