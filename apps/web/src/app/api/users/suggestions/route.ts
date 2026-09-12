import { prisma } from "@/lib/db";
import { successResponse, withAuth } from "@/lib/api-utils";

const LIMIT = 10;
/** Second-hop edges read at most — plenty for a personal graph, bounded for a big one. */
const SECOND_HOP_CAP = 5000;

const USER_SELECT = {
  id: true,
  username: true,
  name: true,
  avatarUrl: true,
  bio: true,
  isPrivate: true,
} as const;

/**
 * People the viewer may know: whoever the people they follow are
 * following, ranked by how many of those follows lead there — with a
 * couple of usernames to say so. When the graph around the viewer is
 * still small, the most followed accounts top the list up. Never the
 * viewer, never anyone already followed or requested.
 */
export const GET = withAuth(async (_request, authUser) => {
  const me = authUser.userId;

  const [accepted, anyStatus] = await Promise.all([
    prisma.follow.findMany({
      where: { followerId: me, status: "ACCEPTED" },
      select: { followingId: true },
    }),
    prisma.follow.findMany({
      where: { followerId: me },
      select: { followingId: true },
    }),
  ]);
  const myFollows = accepted.map((f) => f.followingId);
  const excluded = new Set<string>([me, ...anyStatus.map((f) => f.followingId)]);

  // Second hop: count, per candidate, how many of my follows follow them
  const scores = new Map<string, { count: number; via: string[] }>();
  if (myFollows.length > 0) {
    const secondHop = await prisma.follow.findMany({
      where: { followerId: { in: myFollows }, status: "ACCEPTED" },
      select: { followerId: true, followingId: true },
      take: SECOND_HOP_CAP,
    });
    for (const edge of secondHop) {
      if (excluded.has(edge.followingId)) continue;
      const score = scores.get(edge.followingId) ?? { count: 0, via: [] };
      score.count += 1;
      if (score.via.length < 2) score.via.push(edge.followerId);
      scores.set(edge.followingId, score);
    }
  }
  const ranked = [...scores.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, LIMIT);
  const ids = ranked.map(([id]) => id);

  // Top up with the most followed accounts the viewer doesn't know yet
  if (ids.length < LIMIT) {
    const popular = await prisma.follow.groupBy({
      by: ["followingId"],
      where: { status: "ACCEPTED", followingId: { notIn: [...excluded, ...ids] } },
      _count: { followingId: true },
      orderBy: { _count: { followingId: "desc" } },
      take: LIMIT - ids.length,
    });
    for (const row of popular) ids.push(row.followingId);
  }
  if (ids.length === 0) return successResponse([]);

  const viaIds = [...new Set(ranked.flatMap(([, s]) => s.via))];
  const [users, viaUsers] = await Promise.all([
    prisma.user.findMany({ where: { id: { in: ids } }, select: USER_SELECT }),
    viaIds.length > 0
      ? prisma.user.findMany({ where: { id: { in: viaIds } }, select: { id: true, username: true } })
      : Promise.resolve([]),
  ]);
  const usernameOf = new Map(viaUsers.map((u) => [u.id, u.username]));
  const byId = new Map(users.map((u) => [u.id, u]));

  const items = ids.flatMap((id) => {
    const user = byId.get(id);
    if (!user) return [];
    const score = scores.get(id);
    return [
      {
        ...user,
        isFollowing: false,
        followStatus: null,
        mutualCount: score?.count ?? 0,
        mutualUsernames: (score?.via ?? [])
          .map((v) => usernameOf.get(v))
          .filter((name): name is string => Boolean(name)),
      },
    ];
  });

  return successResponse(items);
});
