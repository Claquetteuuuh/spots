"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Wordmark } from "@/components/wordmark";
import { TabIcon } from "@/components/tab-icons";
import { useAuth } from "@/lib/auth-context";
import { apiClient, onNotificationsChanged, onNotificationsSeen } from "@/lib/api-client";
import { Avatar } from "@/components/avatar";
import { useT } from "@/lib/use-t";

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const t = useT();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pendingCount, setPendingCount] = useState(0);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  // The notifications page has been read: the badge goes at once
  useEffect(() => onNotificationsSeen(() => setPendingCount(0)), []);
  // One was marked unread or dismissed: re-count right away
  useEffect(
    () =>
      onNotificationsChanged(() => {
        void apiClient.followRequests.count().then(setPendingCount).catch(() => {});
      }),
    [],
  );

  // Poll pending follow requests count
  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    async function fetchCount() {
      try {
        const count = await apiClient.followRequests.count();
        if (!cancelled) setPendingCount(count);
      } catch {
        // Silently fail
      }
    }

    fetchCount();
    const interval = setInterval(fetchCount, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  const handleLogout = useCallback(() => {
    logout();
    setMenuOpen(false);
    router.push("/");
  }, [logout, router]);

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* ── Top bar — desktop only ──────────────────────────────────
          The app has no global bar: each screen owns its top edge. Below
          `lg` the pages draw their own headers (see PageHeader) and this
          one stays out of the way. */}
      <header className="sticky top-0 z-50 hidden border-b border-border bg-bg/90 backdrop-blur-md lg:block">
        <nav className="mx-auto grid h-14 w-full max-w-4xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4">
          {/* Logo */}
          <Link
            href={isAuthenticated ? "/map" : "/"}
            className="rounded-full text-accent"
          >
            <Wordmark className="text-xl" />
          </Link>

          {/* Destinations — centre column, desktop only (phones and tablets
              use the bottom tab bar, like the app) */}
          {isAuthenticated ? (
            <div className="hidden items-center gap-2 lg:flex">
              {/* Map */}
              <Link
                href="/map"
                className={`rounded-full p-2.5 transition-colors ${
                  isActive("/map")
                    ? "bg-accent-tint text-accent"
                    : "text-text-secondary hover:bg-bg-secondary hover:text-text"
                }`}
                title={t("spots.map")}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive("/map") ? 2 : 1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
              </Link>

              {/* Explore */}
              <Link
                href="/explore"
                className={`rounded-full p-2.5 transition-colors ${
                  isActive("/explore")
                    ? "bg-accent-tint text-accent"
                    : "text-text-secondary hover:bg-bg-secondary hover:text-text"
                }`}
                title={t("map.allSpots")}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive("/explore") ? 2 : 1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
                </svg>
              </Link>

              {/* Add */}
              <Link
                href="/spot/new"
                className={`rounded-full p-2.5 transition-colors ${
                  isActive("/spot/new")
                    ? "bg-accent-tint text-accent"
                    : "text-text-secondary hover:bg-bg-secondary hover:text-text"
                }`}
                title={t("spots.addSpot")}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive("/spot/new") ? 2 : 1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </Link>

              {/* Search */}
              <Link
                href="/search"
                className={`rounded-full p-2.5 transition-colors ${
                  isActive("/search")
                    ? "bg-accent-tint text-accent"
                    : "text-text-secondary hover:bg-bg-secondary hover:text-text"
                }`}
                title={t("common.search")}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive("/search") ? 2 : 1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              </Link>

              {/* Notifications bell */}
              <Link
                href="/notifications"
                className={`relative rounded-full p-2.5 transition-colors ${
                  isActive("/notifications")
                    ? "bg-accent-tint text-accent"
                    : "text-text-secondary hover:bg-bg-secondary hover:text-text"
                }`}
                title={t("notifications.title")}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive("/notifications") ? 2 : 1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
                {pendingCount > 0 ? (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white">
                    {pendingCount > 9 ? "9+" : pendingCount}
                  </span>
                ) : null}
              </Link>

            </div>
          ) : (
            <span />
          )}

          {/* Account — right column */}
          <div className="flex items-center justify-end gap-3">
            {isAuthenticated ? (
              // On a phone or tablet the profile lives in the bottom tab bar;
              // a second avatar up here would just be the same destination twice.
              <div className="relative hidden lg:block" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-xs font-medium transition-all ring-2 ${
                    isActive(`/profile/${user?.username}`)
                      ? "ring-accent"
                      : "ring-transparent hover:ring-border-dark"
                  }`}
                >
                  <Avatar url={user?.avatarUrl} name={user?.name} size={32} />
                </button>

                {menuOpen ? (
                  <div className="absolute right-0 top-11 z-50 w-60 overflow-hidden rounded-2xl bg-bg py-1.5 shadow-float">
                    <div className="border-b border-border px-4 py-3">
                      <p className="text-sm font-semibold text-text truncate">
                        {user?.name}
                      </p>
                      <p className="text-xs text-text-tertiary truncate">
                        @{user?.username}
                      </p>
                    </div>
                    <Link
                      href={`/profile/${user?.username}`}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-text hover:bg-bg-secondary transition-colors"
                    >
                      <svg className="h-4 w-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                      </svg>
                      {t("users.profile")}
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-text hover:bg-bg-secondary transition-colors"
                    >
                      <svg className="h-4 w-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                      {t("settings.title")}
                    </Link>
                    <div className="border-t border-border my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-error hover:bg-error-light transition-colors cursor-pointer"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                      </svg>
                      {t("auth.logout")}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-full px-4 py-2 text-sm font-semibold text-text transition-colors hover:bg-bg-secondary"
                >
                  {t("auth.login")}
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-dark"
                >
                  {t("auth.register")}
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* ── Bottom tab bar (phone + tablet, authenticated only) ────────
          A copy of the app's tab bar (RootNavigator.tsx): five tabs in the
          same order, the same Ionicons glyphs filled when focused, text
          colour for the focused tab, a solid surface with a hairline on top,
          50px tall plus the home-indicator inset. Tablets keep it too — the
          app looks the same on an iPad — so the desktop header only takes
          over from `lg`. */}
      {isAuthenticated && user ? (
        <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-bg pb-[env(safe-area-inset-bottom)] lg:hidden">
          <div className="flex h-[50px] items-center pt-2" role="tablist">
            {(
              [
                { name: "map", href: "/map", active: isActive("/map"), label: t("spots.map") },
                { name: "search", href: "/search", active: isActive("/search"), label: t("common.search") },
                { name: "add", href: "/spot/new", active: isActive("/spot/new"), label: t("spots.addSpot") },
                {
                  name: "notifications",
                  href: "/notifications",
                  active: isActive("/notifications"),
                  label: t("notifications.title"),
                },
                {
                  name: "profile",
                  href: `/profile/${user.username}`,
                  active: pathname?.startsWith("/profile") ?? false,
                  label: t("users.profile"),
                },
              ] as const
            ).map((tab) => (
              <Link
                key={tab.name}
                href={tab.href}
                role="tab"
                aria-selected={tab.active}
                aria-label={tab.label}
                className={`flex h-full flex-1 items-center justify-center transition-colors ${
                  tab.active ? "text-text" : "text-text-tertiary"
                }`}
              >
                <span className="relative">
                  <TabIcon name={tab.name} focused={tab.active} />
                  {tab.name === "notifications" && pendingCount > 0 ? (
                    <span className="absolute -top-1 -right-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-white">
                      {pendingCount > 9 ? "9+" : pendingCount}
                    </span>
                  ) : null}
                </span>
              </Link>
            ))}
          </div>
        </nav>
      ) : null}
    </>
  );
}
