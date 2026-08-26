import type { User } from "@trs/db";

/**
 * A `User` record with sensitive/internal fields stripped, safe to return
 * from an API response.
 */
export type PublicUser = Omit<User, "passwordHash" | "providerId">;

/**
 * A `User` augmented with the aggregate counts commonly shown on a profile.
 */
export interface UserProfile extends PublicUser {
  spotCount: number;
  followerCount: number;
  followingCount: number;
}

/**
 * Strip sensitive/internal fields (password hash, OAuth provider id) from a
 * full `User` record before returning it in an API response.
 */
export function toPublicUser(user: User): PublicUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- intentionally stripping these two fields
  const { passwordHash, providerId, ...rest } = user;
  return rest;
}

type UserWithCounts = User & {
  _count: { spots: number; followers: number; following: number };
};

/**
 * Build a full profile view (public fields + spot/follower/following
 * counts) from a `User` record fetched with a `_count` selection on
 * `spots`, `followers`, and `following`.
 */
export function toUserProfile(user: UserWithCounts): UserProfile {
  return {
    ...toPublicUser(user),
    spotCount: user._count.spots,
    followerCount: user._count.followers,
    followingCount: user._count.following,
  };
}
