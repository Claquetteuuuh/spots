"use client";

import { startTransition, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import type { FollowRequest, NotificationsData } from "@/lib/api-client";
import { useT } from "@/lib/use-t";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { PAGE_COLUMN, PageHeader } from "@/components/page";

/**
 * Below `lg` the screen fills the space between the top edge and the tab
 * bar (50px + home-indicator inset, already reserved by <main>). The empty
 * state also sits under the 48px screen header.
 */
const FULL_SCREEN = "min-h-[calc(100dvh-50px-env(safe-area-inset-bottom))]";
const UNDER_HEADER = "min-h-[calc(100dvh-48px-50px-env(safe-area-inset-bottom))]";

/** Two initials, like the app: "Alice Photo" → "AP". */
function initialsOf(name: string | null | undefined): string {
  const initials = name
    ?.split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return initials || "?";
}

function Spinner() {
  return (
    <svg className="h-6 w-6 animate-spin text-text-secondary" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function Avatar({ avatarUrl, name }: { avatarUrl: string | null; name: string | null }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className="h-11 w-11 rounded-full border border-border object-cover"
      />
    );
  }
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-bg-tertiary text-[13px] font-semibold text-text-secondary">
      {initialsOf(name)}
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w`;
}

export default function NotificationsPage() {
  const t = useT();
  const [data, setData] = useState<NotificationsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const result = await apiClient.followRequests.list();
      setData(result);
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    startTransition(() => {
      loadData();
    });
  }, [loadData]);

  async function handleAccept(id: string) {
    try {
      await apiClient.followRequests.accept(id);
      setData((prev) =>
        prev
          ? {
              ...prev,
              pendingRequests: prev.pendingRequests.filter((r) => r.id !== id),
            }
          : prev,
      );
    } catch {
      // Error
    }
  }

  async function handleReject(id: string) {
    try {
      await apiClient.followRequests.reject(id);
      setData((prev) =>
        prev
          ? {
              ...prev,
              pendingRequests: prev.pendingRequests.filter((r) => r.id !== id),
            }
          : prev,
      );
    } catch {
      // Error
    }
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${FULL_SCREEN} lg:min-h-0 lg:py-24`}>
        <Spinner />
      </div>
    );
  }

  const pendingRequests = data?.pendingRequests ?? [];
  const newFollowers = data?.newFollowers ?? [];
  const hasContent = pendingRequests.length > 0 || newFollowers.length > 0;

  return (
    <PullToRefresh onRefresh={loadData}>
      <div className={PAGE_COLUMN}>
        <PageHeader title={t("notifications.title")} back={false} />

        {hasContent ? (
          <div>
            {/* Pending follow requests */}
            {pendingRequests.length > 0 && (
              <>
                <p className="pt-4 pb-2 text-[13px] font-semibold text-text">
                  {t("notifications.followRequests")}
                </p>

                <ul>
                  {pendingRequests.map((req) => (
                    <li
                      key={req.id}
                      className="-mx-4 flex items-center gap-3 border-b border-border px-4 py-3 lg:mx-0 lg:px-0"
                    >
                      <Link href={`/profile/${req.follower.username}`} className="shrink-0">
                        <Avatar avatarUrl={req.follower.avatarUrl} name={req.follower.name} />
                      </Link>

                      <Link
                        href={`/profile/${req.follower.username}`}
                        className="min-w-0 flex-1"
                      >
                        <p className="truncate text-[13px] font-semibold text-text">
                          {req.follower.username}
                        </p>
                        <p className="truncate text-xs text-text-tertiary">
                          {req.follower.name}
                        </p>
                      </Link>

                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAccept(req.id)}
                          className="cursor-pointer rounded-sm bg-accent px-4 py-2 text-xs font-semibold text-on-accent transition-colors hover:bg-accent-dark"
                        >
                          {t("notifications.accept")}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(req.id)}
                          className="cursor-pointer rounded-sm border border-border bg-bg-secondary px-4 py-2 text-xs font-semibold text-text transition-colors hover:bg-bg-tertiary"
                        >
                          {t("notifications.reject")}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* New followers (accepted) */}
            {newFollowers.length > 0 && (
              <>
                <p className="pt-4 pb-2 text-[13px] font-semibold text-text">
                  {t("notifications.newFollowers")}
                </p>

                <ul>
                  {newFollowers.map((follower) => (
                    <li
                      key={follower.id}
                      className="-mx-4 flex items-center gap-3 border-b border-border px-4 py-3 lg:mx-0 lg:px-0"
                    >
                      <Link href={`/profile/${follower.follower.username}`} className="shrink-0">
                        <Avatar avatarUrl={follower.follower.avatarUrl} name={follower.follower.name} />
                      </Link>

                      <Link
                        href={`/profile/${follower.follower.username}`}
                        className="min-w-0 flex-1"
                      >
                        <p className="text-[13px] text-text">
                          <span className="font-semibold">{follower.follower.username}</span>
                          {" "}
                          <span className="text-text-secondary">
                            {t("notifications.startedFollowing")}
                          </span>
                        </p>
                      </Link>

                      <span className="shrink-0 text-xs text-text-tertiary">
                        {timeAgo(follower.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        ) : (
          <div className={`flex items-center justify-center pb-16 ${UNDER_HEADER} lg:min-h-0 lg:py-24`}>
            <p className="text-[15px] text-text-secondary">
              {t("notifications.noNotifications")}
            </p>
          </div>
        )}
      </div>
    </PullToRefresh>
  );
}
