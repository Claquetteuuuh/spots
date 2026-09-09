"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
  const [lists, setLists] = useState<{ followers: User[]; following: User[] } | null>(null);
  const [unfollowedIds, setUnfollowedIds] = useState<Set<string>>(new Set());
  const [swipeDirection, setSwipeDirection] = useState(0);

  // "Loading" is simply "open and nothing has arrived yet". Deriving it keeps
  // the fetch effect below free of synchronous setState calls.
  const isLoading = open && lists === null;

  // Re-sync the active tab when the caller opens the modal on a different one.
  // Adjusting state during render, guarded by the previous prop value, is
  // React's sanctioned replacement for a setState-in-effect prop sync.
  const [syncedInitialTab, setSyncedInitialTab] = useState(initialTab);
  if (initialTab !== syncedInitialTab) {
    setSyncedInitialTab(initialTab);
    setTab(initialTab);
  }

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void (async () => {
      try {
        const [followers, following] = await Promise.all([
          apiClient.users.followers(username),
          apiClient.users.following(username),
        ]);
        if (cancelled) return;
        setLists({ followers, following });
        setUnfollowedIds(new Set());
      } catch {
        if (!cancelled) setLists({ followers: [], following: [] });
      }
    })();
    // Closing (or switching profile) discards the data, so the next open
    // starts from the spinner again rather than flashing a stale list.
    return () => {
      cancelled = true;
      setLists(null);
    };
  }, [open, username]);

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

  function switchTab(newTab: Tab) {
    setSwipeDirection(newTab === "following" ? 1 : -1);
    setTab(newTab);
  }

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

  const list = (tab === "followers" ? lists?.followers : lists?.following) ?? [];
  const emptyText =
    tab === "followers" ? t("users.noFollowers") : t("users.noFollowing");
  const isOwnProfile = username === currentUser?.username;

  const listVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 200 : -200,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -200 : 200,
      opacity: 0,
    }),
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={backdropRef}
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ backgroundColor: "rgba(0,0,0,0)" }}
          animate={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          exit={{ backgroundColor: "rgba(0,0,0,0)" }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            if (e.target === backdropRef.current) onClose();
          }}
        >
          <motion.div
            className="relative w-full max-w-md max-h-[70vh] bg-bg border border-border rounded-2xl flex flex-col overflow-hidden mx-4 sm:mx-0"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300, mass: 0.5 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="w-8" />
              <h2 className="text-base font-semibold text-text">{username}</h2>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center text-text-secondary hover:text-text transition-colors cursor-pointer"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs with animated indicator */}
            <div className="flex border-b border-border relative">
              <button
                type="button"
                onClick={() => switchTab("followers")}
                className={`flex-1 py-3 text-sm font-semibold text-center transition-colors cursor-pointer ${
                  tab === "followers" ? "text-text" : "text-text-secondary hover:text-text"
                }`}
              >
                {t("users.followers")}
              </button>
              <button
                type="button"
                onClick={() => switchTab("following")}
                className={`flex-1 py-3 text-sm font-semibold text-center transition-colors cursor-pointer ${
                  tab === "following" ? "text-text" : "text-text-secondary hover:text-text"
                }`}
              >
                {t("users.following")}
              </button>

              {/* Animated indicator */}
              <motion.div
                className="absolute bottom-0 h-[1.5px] bg-text"
                style={{ width: "50%" }}
                animate={{ x: tab === "followers" ? "0%" : "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300, mass: 0.5 }}
              />
            </div>

            {/* Content with slide animation */}
            <div className="flex-1 overflow-hidden relative">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <svg className="h-6 w-6 animate-spin text-text-tertiary" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              ) : (
                <AnimatePresence mode="wait" custom={swipeDirection}>
                  <motion.div
                    key={tab}
                    custom={swipeDirection}
                    variants={listVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: "spring", damping: 25, stiffness: 300, mass: 0.5 }}
                    className="overflow-y-auto h-full"
                  >
                    {list.length === 0 ? (
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
                                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-on-accent text-sm font-semibold shrink-0">
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
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
