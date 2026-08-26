import { prisma } from "@trs/db";
import { spotQuerySchema } from "@trs/shared/validation";
import { successResponse, validateBody, withAuth } from "@/lib/api-utils";
import { paginate } from "@/lib/pagination";

const SPOT_AUTHOR_SELECT = {
  id: true,
  username: true,
  name: true,
  avatarUrl: true,
} as const;

export const GET = withAuth(async (request, authUser) => {
  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const { cursor, limit } = validateBody(spotQuerySchema, searchParams);

  const following = await prisma.follow.findMany({
    where: { followerId: authUser.userId },
    select: { followingId: true },
  });

  if (following.length === 0) {
    return successResponse({ items: [], nextCursor: null });
  }

  const followingIds = following.map((f) => f.followingId);

  const rows = await prisma.spot.findMany({
    where: { userId: { in: followingIds } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: { user: { select: SPOT_AUTHOR_SELECT } },
  });

  return successResponse(paginate(rows, limit));
});
