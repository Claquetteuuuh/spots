"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { apiClient, type User } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/use-t";

type Tab = "followers" | "following";

interface FollowListModalProps {
  open: boolean;
  onClose: () => void;
  username: string;
  initialTab: Tab;
}

export function FollowListModal({
  open,
  onClose,
  username,
  initialTab,
}: FollowListModalProps) {
  const t = useT();
  const { user: currentUser } = useAuth();
  const backdropRef = useRef<HTMLDivElement>(null);

  const [tab, setTab] = useState<Tab>(initialTab);
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unfollowedIds, setUnfollowedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [f, g] = await Promise.all([
        apiClient.users.followers(username),
        apiClient.users.following(username),
      ]);
      setFollowers(f);
      setFollowing(g);
      setUnfollowedIds(new Set());
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }, [username]);

  useEffect(() => {
    if (open) {
      void loadData();
    }
  }, [open, loadData]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  async function handleUnfollow(user: User) {
    try {
      await apiClient.users.unfollow(user.username);
      setUnfollowedIds((prev) => new Set(prev).add(user.id));
    } catch {
      // Silently fail
    }
  }

  async function handleFollow(user: User) {
    try {
      await apiClient.users.follow(user.username);
      setUnfollowedIds((prev) => {
        const next = new Set(prev);
        next.delete(user.id);
        return next;
      });
    } catch {
      // Silently fail
    }
  }

  if (!open) return null;

  const list = tab === "followers" ? followers : following;
  const emptyText =
    tab === "followers" ? t("users.noFollowers") : t("users.noFollowing");
  const isOwnProfile = username === currentUser?.username;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div className="relative w-full max-w-md max-h-[70vh] bg-bg border border-border rounded-md flex flex-col overflow-hidden mx-4 sm:mx-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="w-8" />
          <h2 className="text-base font-semibold text-text">{username}</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-text-secondary hover:text-text transition-colors cursor-pointer"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            type="button"
            onClick={() => setTab("followers")}
            className={`flex-1 py-3 text-sm font-semibold text-center transition-colors cursor-pointer ${
              tab === "followers"
                ? "text-text border-b-2 border-text"
                : "text-text-secondary hover:text-text"
            }`}
          >
            {t("users.followers")}
          </button>
          <button
            type="button"
            onClick={() => setTab("following")}
            className={`flex-1 py-3 text-sm font-semibold text-center transition-colors cursor-pointer ${
              tab === "following"
                ? "text-text border-b-2 border-text"
                : "text-text-secondary hover:text-text"
            }`}
          >
            {t("users.following")}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <svg
                className="h-6 w-6 animate-spin text-text-tertiary"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            </div>
          ) : list.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-text-secondary">{emptyText}</p>
            </div>
          ) : (
            <ul>
              {list.map((user) => {
                const isCurrentUser = user.id === currentUser?.id;
                const wasUnfollowed = unfollowedIds.has(user.id);
                const showButton =
                  !isCurrentUser && isOwnProfile && tab === "following";

                return (
                  <li
                    key={user.id}
                    className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-b-0 hover:bg-bg-secondary transition-colors"
                  >
                    <Link
                      href={`/profile/${user.username}`}
                      onClick={onClose}
                      className="flex items-center gap-3 flex-1 min-w-0"
                    >
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt=""
                          className="h-11 w-11 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-white text-sm font-semibold shrink-0">
                          {user.name?.charAt(0)?.toUpperCase() ?? "?"}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-text truncate">
                          {user.username}
                        </p>
                        <p className="text-xs text-text-secondary truncate">
                          {user.name}
                        </p>
                      </div>
                    </Link>

                    {showButton ? (
                      wasUnfollowed ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleFollow(user)}
                        >
                          {t("users.follow")}
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleUnfollow(user)}
                        >
                          {t("users.unfollow")}
                        </Button>
                      )
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
