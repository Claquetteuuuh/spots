"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { t } from "@/lib/i18n";

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const handleLogout = useCallback(() => {
    logout();
    setMenuOpen(false);
    router.push("/");
  }, [logout, router]);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/95 backdrop-blur-sm">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-text"
        >
          The Right Spot
        </Link>

        {/* Center nav (authenticated) */}
        {isAuthenticated ? (
          <div className="flex items-center gap-6">
            <Link
              href="/map"
              className={`text-sm transition-colors ${
                isActive("/map")
                  ? "text-accent font-medium"
                  : "text-text-secondary hover:text-text"
              }`}
            >
              {t("spots.map")}
            </Link>
            <Link
              href="/feed"
              className={`text-sm transition-colors ${
                isActive("/feed")
                  ? "text-accent font-medium"
                  : "text-text-secondary hover:text-text"
              }`}
            >
              {t("spots.feed")}
            </Link>
          </div>
        ) : null}

        {/* Right side */}
        {isAuthenticated && user ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex h-8 w-8 items-center justify-center rounded-sm bg-bg-tertiary text-xs font-medium text-text-secondary transition-colors hover:bg-accent hover:text-white cursor-pointer"
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="h-8 w-8 rounded-sm object-cover"
                />
              ) : (
                initials
              )}
            </button>

            {menuOpen ? (
              <div className="absolute right-0 top-10 z-50 w-48 border border-border bg-bg rounded-sm py-1">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-sm font-medium text-text truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-text-tertiary truncate">
                    @{user.username}
                  </p>
                </div>
                <Link
                  href={`/profile/${user.username}`}
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 text-sm text-text-secondary hover:bg-bg-secondary transition-colors"
                >
                  {t("users.profile")}
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 text-sm text-text-secondary hover:bg-bg-secondary transition-colors"
                >
                  {t("settings.title")}
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 text-sm text-error hover:bg-error-light transition-colors cursor-pointer"
                >
                  {t("auth.logout")}
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-text-secondary hover:text-text transition-colors"
            >
              {t("auth.login")}
            </Link>
            <Link
              href="/register"
              className="rounded-sm bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-dark transition-colors"
            >
              {t("auth.register")}
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
