"use client";

import { startTransition, use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import type { Spot, User } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { ProfileSkeleton, SpotGridSkeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/avatar";
import { FollowListModal } from "@/components/follow-list-modal";
import { useT } from "@/lib/use-t";
import { PAGE_WIDE, PageHeader } from "@/components/page";

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

  /**
   * The app's screen header, below `lg` only. Your own profile is a tab: the
   * username with a single gear to Settings, no back control (notifications
   * live in the tab bar). Someone else's profile is pushed onto the stack:
   * a bare chevron, no title. From `lg` the desktop layout draws its own
   * username row, so the bar is dropped there — `contents` keeps the bar's
   * sticky positioning working against the page rather than this wrapper.
   */
  const header = (
    <div className="contents lg:hidden">
      {isOwnProfile ? (
        <PageHeader
          title={username}
          back={false}
          actions={
            <Link
              href="/settings"
              aria-label={t("settings.title")}
              className="-mr-1 p-1 text-text"
            >
              <GearIcon className="h-6 w-6" />
            </Link>
          }
        />
      ) : (
        <PageHeader title="" />
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className={`${PAGE_WIDE} pb-6 pt-4 lg:py-8`}>
        {header}
        <ProfileSkeleton />
        <div className="-mx-4 mt-6 lg:mx-0 lg:mt-10">
          <SpotGridSkeleton />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={PAGE_WIDE}>
        {header}
        <div className="flex items-center justify-center py-24">
          <p className="text-error">{t("users.notFound")}</p>
        </div>
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

  /**
   * Edit profile (own) or Follow / Unfollow / Requested (other). Below `lg`
   * it is the app's full-width pill under the bio; on desktop a compact pill
   * beside the username.
   */
  const renderAction = (size: "sm" | "md", fullWidth: boolean) =>
    isOwnProfile ? (
      <Link href="/profile/edit" className={fullWidth ? "block" : undefined}>
        <Button variant="secondary" size={size} fullWidth={fullWidth}>
          {t("users.editProfile")}
        </Button>
      </Link>
    ) : (
      <Button
        variant={followVariant}
        size={size}
        fullWidth={fullWidth}
        onClick={handleFollowToggle}
      >
        {followLabel}
      </Button>
    );

  const spotsGrid = spots.length === 0 ? (
    <p className="py-12 text-center text-[15px] text-text-secondary">
      {t("spots.noSpots")}
    </p>
  ) : (
    <div className="-mx-4 grid grid-cols-3 gap-px lg:mx-0 lg:gap-2">
      {spots.map((spot) => (
        <Link
          key={spot.id}
          href={`/spot/${spot.id}`}
          className="group aspect-square overflow-hidden rounded-none bg-bg-secondary lg:rounded-xl"
        >
          <img
            src={spot.photoUrl}
            alt={spot.title ?? ""}
            className="h-full w-full object-cover group-hover:opacity-80 transition-opacity duration-200"
          />
        </Link>
      ))}
    </div>
  );

  const spotsMap = spots.length === 0 ? (
    <p className="py-12 text-center text-[15px] text-text-secondary">
      {t("spots.noSpots")}
    </p>
  ) : (
    <ProfileMapView spots={spots} />
  );

  return (
    <PullToRefresh onRefresh={loadProfile}>
    <div className={`${PAGE_WIDE} pb-6 pt-4 lg:py-6`}>
      {header}

      {/*
        Profile header. Below `lg` it is the app's: an 80px avatar with the
        three stats beside it, then name, handle, bio and a full-width pill.
        From `lg` the avatar grows and the username row, stats and bio stack
        in a column beside it, Instagram style. One DOM serves both — the
        avatar spans the desktop rows and the bio block drops under the
        avatar row on small screens.
      */}
      <div className="mt-4 grid grid-cols-[auto_1fr] items-center gap-x-4 lg:mt-0 lg:items-start lg:gap-x-12">
        {/* Avatar */}
        <div className="shrink-0 lg:row-span-3">
          <Avatar
            url={profile.avatarUrl}
            name={profile.name}
            className="h-20 w-20 lg:h-36 lg:w-36 lg:border lg:border-border text-[22px] lg:text-4xl lg:bg-accent-tint lg:text-accent-dark"
          />
        </div>

        {/* Desktop only: username + action row (below lg the PageHeader is the username) */}
        <div className="hidden flex-wrap items-center gap-3 lg:flex">
          <h1 className="text-xl font-normal text-text">{profile.username}</h1>
          {renderAction("sm", false)}
          {isOwnProfile ? (
            <>
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
                <GearIcon className="h-6 w-6" />
              </Link>
            </>
          ) : null}
        </div>

        {/* Stats: value over label beside the avatar; inline "12 followers" on desktop */}
        <div className="flex justify-around lg:mt-4 lg:justify-start lg:gap-8">
          <Stat value={spotsCount} label={t("users.spotsTab")} />
          <Stat
            value={followersCount}
            label={t("users.followers")}
            onClick={() => openFollowList("followers")}
          />
          <Stat
            value={followingCount}
            label={t("users.following")}
            onClick={() => openFollowList("following")}
          />
        </div>

        {/* Name, handle, bio, action */}
        <div className="col-span-2 mt-4 min-w-0 lg:col-span-1 lg:col-start-2">
          <div className="flex items-center gap-1.5">
            <p className="text-[15px] font-semibold text-text lg:text-sm">{profile.name}</p>
            {profileIsPrivate && !isOwnProfile ? (
              <LockIcon className="h-3.5 w-3.5 text-text-secondary" />
            ) : null}
          </div>
          {!isOwnProfile ? (
            <p className="mt-0.5 text-[13px] text-text-secondary lg:hidden">
              @{profile.username}
            </p>
          ) : null}
          {profile.bio ? (
            <p className="mt-1 text-[13px] leading-[1.4] text-text lg:text-sm lg:leading-relaxed">
              {profile.bio}
            </p>
          ) : null}
          <div className="mt-4 lg:hidden">{renderAction("md", true)}</div>
        </div>
      </div>

      {/* Private account gate */}
      {isPrivateAndNotFollowing ? (
        <div className="mt-3 flex flex-col items-center gap-3 px-6 pt-12 text-center lg:mt-8 lg:border-t lg:border-border">
          <LockIcon className="h-12 w-12 text-text-tertiary" strokeWidth={1} />
          <p className="text-[15px] font-semibold text-text">
            {t("users.privateAccountMessage")}
          </p>
          <p className="text-[13px] text-text-secondary">
            {t("users.followToSee")}
          </p>
        </div>
      ) : (
        <>
          {/*
            Tab bar: Spots | Map. The app only offers the map on someone
            else's profile (your own has the Map tab), and draws the tabs as
            bare 22px icons underlined in text colour, full-bleed. Desktop
            keeps its labelled, accent-coloured tabs on both profiles.
          */}
          <div
            className={`-mx-4 mt-3 border-b border-border lg:mx-0 lg:mt-8 lg:border-b-0 lg:border-t ${
              isOwnProfile ? "hidden lg:flex" : "flex"
            }`}
          >
            <ProfileTabButton
              active={activeTab === "spots"}
              onClick={() => setActiveTab("spots")}
              label={t("users.spotsTab")}
            >
              <svg className="h-[22px] w-[22px] lg:h-3 lg:w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
              </svg>
            </ProfileTabButton>
            <ProfileTabButton
              active={activeTab === "map"}
              onClick={() => setActiveTab("map")}
              label={t("users.mapTab")}
            >
              <svg className="h-[22px] w-[22px] lg:h-3 lg:w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m0 0-3.75-1.5L9 15Zm0 0 3.75-1.5M9 15l3.75 1.5m0-9V15m0 0 3.75-1.5M12.75 15l3.75 1.5m0-9v7.5m0 0 .75-.25" />
              </svg>
            </ProfileTabButton>
          </div>

          {/*
            Tab content. Your own profile never shows the map below `lg`
            (the tabs are hidden there), so if Map was picked on a desktop
            that then shrinks, the grid takes over.
          */}
          <div className={isOwnProfile ? "mt-6 lg:mt-0 lg:pt-1" : "lg:pt-1"}>
            {activeTab === "spots" ? (
              spotsGrid
            ) : isOwnProfile ? (
              <>
                <div className="lg:hidden">{spotsGrid}</div>
                <div className="hidden lg:block">{spotsMap}</div>
              </>
            ) : (
              spotsMap
            )}
          </div>
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

/**
 * One profile stat. The app stacks an 18px bold value over a 12px secondary
 * label; desktop keeps its inline "12 followers" reading.
 */
function Stat({
  value,
  label,
  onClick,
}: {
  value: number;
  label: string;
  onClick?: () => void;
}) {
  const className = "flex flex-col items-center lg:flex-row lg:items-baseline lg:gap-1";
  const content = (
    <>
      <span className="text-lg font-bold text-text lg:text-sm lg:font-semibold">{value}</span>
      <span className="text-xs text-text-secondary lg:text-sm lg:lowercase">{label}</span>
    </>
  );

  if (!onClick) return <div className={className}>{content}</div>;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${className} cursor-pointer transition-opacity hover:opacity-70`}
    >
      {content}
    </button>
  );
}

/**
 * A Spots | Map tab. Below `lg` it is the app's: icon only, filling its half,
 * a 1.5px underline in text colour when active and tertiary text otherwise.
 * From `lg` the icon shrinks beside a label and the active tab turns accent.
 */
function ProfileTabButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`-mb-px flex flex-1 cursor-pointer items-center justify-center gap-2 border-b-[1.5px] py-3 transition-colors lg:mb-0 lg:border-b-2 lg:py-3.5 lg:text-sm lg:font-semibold ${
        active
          ? "border-text text-text lg:border-accent lg:text-accent"
          : "border-transparent text-text-tertiary lg:hover:text-text-secondary"
      }`}
    >
      {children}
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}

function GearIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

function LockIcon({ className, strokeWidth = 1.5 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
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

  /* The app's map is 400px, edge to edge, square; desktop keeps its framed map. */
  return (
    <div
      ref={containerRef}
      className="-mx-4 h-[400px] overflow-hidden lg:mx-0 lg:rounded lg:border lg:border-border"
    />
  );
}
