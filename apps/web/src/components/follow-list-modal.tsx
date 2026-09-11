"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient, type User, type SentFollowRequest } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/use-t";

type Tab = "followers" | "following" | "requests";

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

  const isOwnProfile = username === currentUser?.username;
  const tabs: Tab[] = isOwnProfile
    ? ["followers", "following", "requests"]
    : ["followers", "following"];

  const [tab, setTab] = useState<Tab>(initialTab);
  const [lists, setLists] = useState<{ followers: User[]; following: User[] } | null>(null);
  const [sentRequests, setSentRequests] = useState<SentFollowRequest[]>([]);
  const [unfollowedIds, setUnfollowedIds] = useState<Set<string>>(new Set());
  const [cancelledIds, setCancelledIds] = useState<Set<string>>(new Set());
  const [swipeDirection, setSwipeDirection] = useState(0);

  const isLoading = open && lists === null;

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
        const promises: [Promise<User[]>, Promise<User[]>, Promise<SentFollowRequest[]>?] = [
          apiClient.users.followers(username),
          apiClient.users.following(username),
        ];
        if (isOwnProfile) {
          promises.push(apiClient.followRequests.sent());
        }
        const [followers, following, sent] = await Promise.all(promises);
        if (cancelled) return;
        setLists({ followers, following });
        setSentRequests(sent ?? []);
        setUnfollowedIds(new Set());
        setCancelledIds(new Set());
      } catch {
        if (!cancelled) {
          setLists({ followers: [], following: [] });
          setSentRequests([]);
        }
      }
    })();
    return () => {
      cancelled = true;
      setLists(null);
    };
  }, [open, username, isOwnProfile]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  function switchTab(newTab: Tab) {
    const currentIdx = tabs.indexOf(tab);
    const newIdx = tabs.indexOf(newTab);
    setSwipeDirection(newIdx > currentIdx ? 1 : -1);
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

  async function handleCancelRequest(req: SentFollowRequest) {
    try {
      await apiClient.users.unfollow(req.following.username);
      setCancelledIds((prev) => new Set(prev).add(req.id));
    } catch {
      // Silently fail
    }
  }

  if (!open) return null;

  const tabWidth = `${100 / tabs.length}%`;
  const tabIndex = tabs.indexOf(tab);

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

  function renderUserList() {
    if (tab === "requests") {
      const visibleRequests = sentRequests.filter((r) => !cancelledIds.has(r.id));

      if (visibleRequests.length === 0) {
        return (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-text-secondary">{t("users.noRequests")}</p>
          </div>
        );
      }

      return (
        <ul>
          {visibleRequests.map((req) => (
            <li
              key={req.id}
              className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-b-0 hover:bg-bg-secondary transition-colors"
            >
              <Link
                href={`/profile/${req.following.username}`}
                onClick={onClose}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <Avatar url={req.following.avatarUrl} name={req.following.name} className="h-11 w-11 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-text truncate">
                    {req.following.username}
                  </p>
                  <p className="text-xs text-text-secondary truncate">
                    {req.following.name}
                  </p>
                </div>
              </Link>

              <Button
                variant="secondary"
                size="md"
                onClick={() => handleCancelRequest(req)}
              >
                {t("users.cancelRequest")}
              </Button>
            </li>
          ))}
        </ul>
      );
    }

    const list = (tab === "followers" ? lists?.followers : lists?.following) ?? [];
    const emptyText =
      tab === "followers" ? t("users.noFollowers") : t("users.noFollowing");

    if (list.length === 0) {
      return (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-text-secondary">{emptyText}</p>
        </div>
      );
    }

    return (
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
                <Avatar url={user.avatarUrl} name={user.name} className="h-11 w-11 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-text truncate">
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
                    size="md"
                    onClick={() => handleFollow(user)}
                  >
                    {t("users.follow")}
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="md"
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
    );
  }

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
            className="fixed inset-0 flex flex-col overflow-hidden bg-bg pb-[env(safe-area-inset-bottom)]
              lg:relative lg:inset-auto lg:mx-0 lg:w-full lg:max-w-md lg:max-h-[70vh] lg:rounded-2xl lg:border lg:border-border lg:pb-0"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300, mass: 0.5 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="w-8 order-last lg:order-first" />
              <h2 className="flex-1 truncate text-center text-base font-semibold text-text">
                {username}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label={t("common.close")}
                className="order-first lg:order-last w-8 h-8 flex items-center justify-center text-text lg:text-text-secondary lg:hover:text-text transition-colors cursor-pointer"
              >
                <svg className="h-6 w-6 lg:h-5 lg:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs with animated indicator */}
            <div className="flex border-b border-border relative">
              {tabs.map((t_) => (
                <button
                  key={t_}
                  type="button"
                  onClick={() => switchTab(t_)}
                  className={`flex-1 py-3 text-sm font-semibold text-center transition-colors cursor-pointer ${
                    tab === t_ ? "text-text" : "text-text-secondary hover:text-text"
                  }`}
                >
                  {t_ === "followers"
                    ? t("users.followers")
                    : t_ === "following"
                      ? t("users.following")
                      : t("users.requests")}
                </button>
              ))}

              {/* Animated indicator */}
              <motion.div
                className="absolute bottom-0 h-[1.5px] bg-text"
                style={{ width: tabWidth }}
                animate={{ x: `${tabIndex * 100}%` }}
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
                    {renderUserList()}
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
