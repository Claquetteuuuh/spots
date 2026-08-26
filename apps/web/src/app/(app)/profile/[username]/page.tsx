"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import type { Spot, User } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { ProfileSkeleton, SpotGridSkeleton } from "@/components/ui/skeleton";
import { t } from "@/lib/i18n";

export default function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState<(User & { isFollowing?: boolean }) | null>(null);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  const isOwnProfile = currentUser?.username === username;

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const userData = await apiClient.users.profile(username) as User & { isFollowing?: boolean };
      setProfile(userData);
      setIsFollowing(userData.isFollowing ?? false);

      const spotsData = await apiClient.spots.list({ userId: userData.id });
      setSpots(spotsData.items);
    } catch {
      // Error handled by empty profile state
    } finally {
      setIsLoading(false);
    }
  }, [username]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  async function handleFollowToggle() {
    if (!profile) return;
    try {
      if (isFollowing) {
        await apiClient.users.unfollow(profile.username);
        setIsFollowing(false);
        setProfile((p) =>
          p?._count
            ? { ...p, _count: { ...p._count, followers: p._count.followers - 1 } }
            : p,
        );
      } else {
        await apiClient.users.follow(profile.username);
        setIsFollowing(true);
        setProfile((p) =>
          p?._count
            ? { ...p, _count: { ...p._count, followers: p._count.followers + 1 } }
            : p,
        );
      }
    } catch {
      // Silently fail
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <ProfileSkeleton />
        <div className="mt-10">
          <SpotGridSkeleton />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-error">{t("users.notFound")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Profile header */}
      <div className="flex items-start gap-6">
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt=""
            className="h-20 w-20 rounded-sm object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-sm bg-accent text-white text-2xl font-medium">
            {profile.name?.charAt(0)?.toUpperCase() ?? "?"}
          </div>
        )}

        <div className="flex-1">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold text-text">
              {profile.name}
            </h1>
            {!isOwnProfile ? (
              <Button
                variant={isFollowing ? "secondary" : "primary"}
                size="sm"
                onClick={handleFollowToggle}
              >
                {isFollowing ? t("users.unfollow") : t("users.follow")}
              </Button>
            ) : (
              <Link href="/settings">
                <Button variant="secondary" size="sm">
                  {t("users.editProfile")}
                </Button>
              </Link>
            )}
          </div>
          <p className="mt-1 text-sm text-text-secondary">@{profile.username}</p>

          {profile.bio ? (
            <p className="mt-3 text-sm text-text-secondary leading-relaxed">
              {profile.bio}
            </p>
          ) : null}

          {/* Stats */}
          <div className="mt-4 flex gap-6">
            <span className="text-sm">
              <strong className="text-text">
                {profile._count?.spots ?? spots.length}
              </strong>{" "}
              <span className="text-text-secondary">spots</span>
            </span>
            <span className="text-sm">
              <strong className="text-text">
                {profile._count?.followers ?? 0}
              </strong>{" "}
              <span className="text-text-secondary">
                {t("users.followers").toLowerCase()}
              </span>
            </span>
            <span className="text-sm">
              <strong className="text-text">
                {profile._count?.following ?? 0}
              </strong>{" "}
              <span className="text-text-secondary">
                {t("users.following").toLowerCase()}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Spots grid */}
      <div className="mt-10">
        <h2 className="text-xs uppercase tracking-wide text-text-tertiary mb-4">
          {t("spots.title")}
        </h2>

        {spots.length === 0 ? (
          <p className="text-center py-12 text-text-secondary">
            {t("spots.noSpots")}
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
            {spots.map((spot) => (
              <Link
                key={spot.id}
                href={`/spot/${spot.id}`}
                className="aspect-square overflow-hidden bg-bg-secondary group"
              >
                <img
                  src={spot.photoUrl}
                  alt={spot.title ?? ""}
                  className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
