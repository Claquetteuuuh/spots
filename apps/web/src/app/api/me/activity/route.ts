import { prisma } from "@/lib/db";
import { ACTIVITY_KINDS, type ActivityKind } from "@trs/shared/validation";
import { errorResponse, successResponse, withAuth } from "@/lib/api-utils";

const PERSON_SELECT = { id: true, username: true, name: true, avatarUrl: true } as const;
const SPOT_SUMMARY_SELECT = {
  id: true,
  title: true,
  photoUrl: true,
  city: true,
  country: true,
  userId: true,
  user: { select: PERSON_SELECT },
} as const;

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

/**
 * GET /api/me/activity?type=likes|photos&cursor=&limit=
 *
 * What the viewer has done around spots: the spots they liked, or the
 * photos they added under other people's spots — newest first, by cursor.
 */
export const GET = withAuth(async (request, authUser) => {
  const url = new URL(request.url);
  const type = url.searchParams.get("type") ?? "";
  if (!(ACTIVITY_KINDS as readonly string[]).includes(type)) {
    return errorResponse(`type must be one of ${ACTIVITY_KINDS.join(", ")}`, 400);
  }
  const cursor = url.searchParams.get("cursor") ?? undefined;
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(url.searchParams.get("limit")) || DEFAULT_LIMIT));

  const page = {
    where: { userId: authUser.userId },
    orderBy: [{ createdAt: "desc" as const }, { id: "desc" as const }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  };

  const rows =
    (type as ActivityKind) === "likes"
      ? await prisma.spotLike.findMany({ ...page, include: { spot: { select: SPOT_SUMMARY_SELECT } } })
      : await prisma.spotPhoto.findMany({ ...page, include: { spot: { select: SPOT_SUMMARY_SELECT } } });

  const items = rows.slice(0, limit);
  const nextCursor = rows.length > limit ? items[items.length - 1].id : null;

  return successResponse({ items, nextCursor });
});
