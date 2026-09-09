"use client";

import { startTransition, use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import type { Spot, User } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { ProfileSkeleton, SpotGridSkeleton } from "@/components/ui/skeleton";
import { FollowListModal } from "@/components/follow-list-modal";
import { useT } from "@/lib/use-t";
import { PAGE_WIDE } from "@/components/page";

type FollowStatus = "ACCEPTED" | "PENDING" | null;
type ProfileTab = "spots" | "map";

export default function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const { user: currentUser } = useAuth();
  const t = useT();

  const [profile, setProfile] = useState<(User & { followStatus?: FollowStatus }) | null>(null);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followStatus, setFollowStatus] = useState<FollowStatus>(null);

  const [activeTab, setActiveTab] = useState<ProfileTab>("spots");
  const [followModalOpen, setFollowModalOpen] = useState(false);
  const [followModalTab, setFollowModalTab] = useState<"followers" | "following">("followers");

  const openFollowList = (tab: "followers" | "following") => {
    setFollowModalTab(tab);
    setFollowModalOpen(true);
  };

  const isOwnProfile = currentUser?.username === username;

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const userData = await apiClient.users.profile(username) as User & {
        isFollowing?: boolean;
        followStatus?: FollowStatus;
      };
      setProfile(userData);
      // Use followStatus from API if available, fall back to isFollowing
      if (userData.followStatus) {
        setFollowStatus(userData.followStatus);
      } else if (userData.isFollowing) {
        setFollowStatus("ACCEPTED");
      } else {
        setFollowStatus(null);
      }

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

  // Load Leaflet CSS for map tab
  useEffect(() => {
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
  }, []);

  async function handleFollowToggle() {
    if (!profile) return;
    try {
      if (followStatus === "ACCEPTED" || followStatus === "PENDING") {
        // Unfollow or cancel request
        await apiClient.users.unfollow(profile.username);
        setFollowStatus(null);
        if (followStatus === "ACCEPTED") {
          setProfile((p) =>
            p?._count
              ? { ...p, _count: { ...p._count, followers: p._count.followers - 1 } }
              : p,
          );
        }
      } else {
        // Send follow request — auto-accepted for public accounts
        await apiClient.users.follow(profile.username);
        const profileAnyCheck = profile as unknown as Record<string, unknown>;
        const targetIsPrivate = profileAnyCheck.isPrivate === true;
        if (targetIsPrivate) {
          setFollowStatus("PENDING");
        } else {
          setFollowStatus("ACCEPTED");
          setProfile((p) =>
            p?._count
              ? { ...p, _count: { ...p._count, followers: p._count.followers + 1 } }
              : p,
          );
          // Reload spots since we now have access
          const spotsData = await apiClient.spots.list({ userId: profile.id });
          setSpots(spotsData.items);
        }
      }
    } catch {
      // Silently fail
    }
  }

  if (isLoading) {
    return (
      <div className={`${PAGE_WIDE} py-8`}>
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
  // Use accepted-only counts returned by the API (followerCount/followingCount)
  // falling back to _count which may include pending
  const profileAny = profile as unknown as Record<string, unknown>;
  const followersCount = (profileAny.followerCount as number | undefined) ?? profile._count?.followers ?? 0;
  const followingCount = (profileAny.followingCount as number | undefined) ?? profile._count?.following ?? 0;
  const profileIsPrivate = profileAny.isPrivate === true;
  const isPrivateAndNotFollowing = profileIsPrivate && !isOwnProfile && followStatus !== "ACCEPTED";

  // Follow button label and variant
  let followLabel = t("users.follow");
  let followVariant: "primary" | "secondary" = "primary";
  if (followStatus === "ACCEPTED") {
    followLabel = t("users.unfollow");
    followVariant = "secondary";
  } else if (followStatus === "PENDING") {
    followLabel = t("notifications.requested");
    followVariant = "secondary";
  }

  return (
    <PullToRefresh onRefresh={loadProfile}>
    <div className={`${PAGE_WIDE} py-6`}>
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
            <div className="flex h-20 w-20 sm:h-36 sm:w-36 items-center justify-center rounded-full bg-accent-tint text-accent-dark text-2xl sm:text-4xl font-semibold">
              {profile.name?.charAt(0)?.toUpperCase() ?? "?"}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Name + action row */}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-normal text-text flex items-center gap-1.5">
              {profile.username}
              {profileIsPrivate ? (
                <svg className="h-4 w-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              ) : null}
            </h1>
            {!isOwnProfile ? (
              <Button
                variant={followVariant}
                size="sm"
                onClick={handleFollowToggle}
              >
                {followLabel}
              </Button>
            ) : (
              <>
                <Link href="/profile/edit">
                  <Button variant="secondary" size="sm">
                    {t("users.editProfile")}
                  </Button>
                </Link>
                <Link
                  href="/notifications"
                  className="p-2 text-text-secondary hover:text-text transition-colors"
                  title={t("notifications.title")}
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                  </svg>
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
            <button
              type="button"
              onClick={() => openFollowList("followers")}
              className="text-sm cursor-pointer hover:opacity-70 transition-opacity"
            >
              <strong className="font-semibold text-text">{followersCount}</strong>{" "}
              <span className="text-text-secondary">
                {t("users.followers").toLowerCase()}
              </span>
            </button>
            <button
              type="button"
              onClick={() => openFollowList("following")}
              className="text-sm cursor-pointer hover:opacity-70 transition-opacity"
            >
              <strong className="font-semibold text-text">{followingCount}</strong>{" "}
              <span className="text-text-secondary">
                {t("users.following").toLowerCase()}
              </span>
            </button>
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
        <button
          type="button"
          onClick={() => openFollowList("followers")}
          className="text-center cursor-pointer"
        >
          <p className="text-sm font-semibold text-text">{followersCount}</p>
          <p className="text-xs text-text-secondary">{t("users.followers").toLowerCase()}</p>
        </button>
        <button
          type="button"
          onClick={() => openFollowList("following")}
          className="text-center cursor-pointer"
        >
          <p className="text-sm font-semibold text-text">{followingCount}</p>
          <p className="text-xs text-text-secondary">{t("users.following").toLowerCase()}</p>
        </button>
      </div>

      {/* Private account gate */}
      {isPrivateAndNotFollowing ? (
        <div className="mt-8 border-t border-border pt-12 flex flex-col items-center gap-3">
          <svg className="h-12 w-12 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
          <p className="text-base font-semibold text-text">
            {t("users.privateAccountMessage")}
          </p>
          <p className="text-sm text-text-secondary">
            {t("users.followToSee")}
          </p>
        </div>
      ) : (
        <>
          {/* Tab bar: Spots | Map */}
          <div className="mt-8 border-t border-border flex">
            <button
              type="button"
              onClick={() => setActiveTab("spots")}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold cursor-pointer transition-colors border-b-2 ${
                activeTab === "spots"
                  ? "text-accent border-accent"
                  : "text-text-tertiary border-transparent hover:text-text-secondary"
              }`}
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
              </svg>
              {t("users.spotsTab")}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("map")}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold cursor-pointer transition-colors border-b-2 ${
                activeTab === "map"
                  ? "text-accent border-accent"
                  : "text-text-tertiary border-transparent hover:text-text-secondary"
              }`}
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m0 0-3.75-1.5L9 15Zm0 0 3.75-1.5M9 15l3.75 1.5m0-9V15m0 0 3.75-1.5M12.75 15l3.75 1.5m0-9v7.5m0 0 .75-.25" />
              </svg>
              {t("users.mapTab")}
            </button>
          </div>

          {/* Spots grid */}
          {activeTab === "spots" ? (
            <div className="pt-1">
              {spots.length === 0 ? (
                <p className="text-center py-12 text-text-secondary">
                  {t("spots.noSpots")}
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  {spots.map((spot) => (
                    <Link
                      key={spot.id}
                      href={`/spot/${spot.id}`}
                      className="group aspect-square overflow-hidden rounded-xl bg-bg-secondary"
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
          ) : (
            /* Map tab */
            <div className="pt-1">
              {spots.length === 0 ? (
                <p className="text-center py-12 text-text-secondary">
                  {t("spots.noSpots")}
                </p>
              ) : (
                <ProfileMapView spots={spots} />
              )}
            </div>
          )}
        </>
      )}
    </div>

      <FollowListModal
        open={followModalOpen}
        onClose={() => setFollowModalOpen(false)}
        username={username}
        initialTab={followModalTab}
      />
    </PullToRefresh>
  );
}

/** Vanilla-Leaflet map showing a user's spots */
function ProfileMapView({ spots }: { spots: Spot[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);

  useEffect(() => {
    import("leaflet").then((L) => {
      if (!containerRef.current || mapRef.current) return;

      const centerLat = spots.reduce((s, p) => s + p.latitude, 0) / spots.length;
      const centerLng = spots.reduce((s, p) => s + p.longitude, 0) / spots.length;

      const map = L.map(containerRef.current).setView([centerLat, centerLng], 11);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      }).addTo(map);

      for (const spot of spots) {
        L.marker([spot.latitude, spot.longitude])
          .addTo(map)
          .bindPopup(
            `<a href="/spot/${spot.id}" style="font-weight:500">${spot.title ?? "Spot"}</a>`,
          );
      }

      // Fit bounds if multiple spots
      if (spots.length > 1) {
        const group = L.featureGroup(
          spots.map((s) => L.marker([s.latitude, s.longitude])),
        );
        map.fitBounds(group.getBounds().pad(0.15));
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [spots]);

  return (
    <div
      ref={containerRef}
      className="h-[400px] rounded overflow-hidden border border-border"
    />
  );
}
