"use client";

import { startTransition, use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import type { Spot, User } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { ProfileSkeleton, SpotGridSkeleton } from "@/components/ui/skeleton";
import { useT } from "@/lib/use-t";

export default function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const { user: currentUser } = useAuth();
  const t = useT();

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
    startTransition(() => {
      loadProfile();
    });
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

  const spotsCount = profile._count?.spots ?? spots.length;
  const followersCount = profile._count?.followers ?? 0;
  const followingCount = profile._count?.following ?? 0;

  return (
    <PullToRefresh onRefresh={loadProfile}>
    <div className="mx-auto max-w-4xl px-4 py-6">
      {/* Profile header — Instagram style */}
      <div className="flex items-start gap-8 sm:gap-12">
        {/* Avatar */}
        <div className="shrink-0">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt=""
              className="h-20 w-20 sm:h-36 sm:w-36 rounded-full object-cover border border-border"
            />
          ) : (
            <div className="flex h-20 w-20 sm:h-36 sm:w-36 items-center justify-center rounded-full bg-accent text-white text-2xl sm:text-4xl font-semibold">
              {profile.name?.charAt(0)?.toUpperCase() ?? "?"}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Name + action row */}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-normal text-text">
              {profile.username}
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
              <>
                <Link href="/settings">
                  <Button variant="secondary" size="sm">
                    {t("users.editProfile")}
                  </Button>
                </Link>
                <Link
                  href="/settings"
                  className="p-2 text-text-secondary hover:text-text transition-colors"
                  title={t("settings.title")}
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                </Link>
              </>
            )}
          </div>

          {/* Stats row */}
          <div className="mt-4 flex gap-8">
            <span className="text-sm">
              <strong className="font-semibold text-text">{spotsCount}</strong>{" "}
              <span className="text-text-secondary">spots</span>
            </span>
            <span className="text-sm">
              <strong className="font-semibold text-text">{followersCount}</strong>{" "}
              <span className="text-text-secondary">
                {t("users.followers").toLowerCase()}
              </span>
            </span>
            <span className="text-sm">
              <strong className="font-semibold text-text">{followingCount}</strong>{" "}
              <span className="text-text-secondary">
                {t("users.following").toLowerCase()}
              </span>
            </span>
          </div>

          {/* Bio */}
          <div className="mt-4">
            <p className="text-sm font-semibold text-text">{profile.name}</p>
            {profile.bio ? (
              <p className="mt-1 text-sm text-text leading-relaxed">
                {profile.bio}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Mobile stats row (visible on small screens below avatar) */}
      <div className="sm:hidden mt-4 flex justify-around border-t border-border pt-3">
        <div className="text-center">
          <p className="text-sm font-semibold text-text">{spotsCount}</p>
          <p className="text-xs text-text-secondary">spots</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-text">{followersCount}</p>
          <p className="text-xs text-text-secondary">{t("users.followers").toLowerCase()}</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-text">{followingCount}</p>
          <p className="text-xs text-text-secondary">{t("users.following").toLowerCase()}</p>
        </div>
      </div>

      {/* Spots grid — Instagram style (3 cols, square) */}
      <div className="mt-8 border-t border-border pt-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <svg className="h-3 w-3 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
          </svg>
          <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
            {t("spots.title")}
          </span>
        </div>

        {spots.length === 0 ? (
          <p className="text-center py-12 text-text-secondary">
            {t("spots.noSpots")}
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-0.5 sm:gap-1">
            {spots.map((spot) => (
              <Link
                key={spot.id}
                href={`/spot/${spot.id}`}
                className="aspect-square overflow-hidden bg-bg-secondary group"
              >
                <img
                  src={spot.photoUrl}
                  alt={spot.title ?? ""}
                  className="h-full w-full object-cover group-hover:opacity-80 transition-opacity duration-200"
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
    </PullToRefresh>
  );
}
