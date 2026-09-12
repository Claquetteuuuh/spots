"use client";

import { startTransition, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import type { FollowRequest, NotificationsData } from "@/lib/api-client";
import { useT } from "@/lib/use-t";
import { Avatar } from "@/components/avatar";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { PAGE_COLUMN, PageHeader } from "@/components/page";
import { SwipeRow } from "@/components/swipe-row";

/**
 * Below `lg` the screen fills the space between the top edge and the tab
 * bar (50px + home-indicator inset, already reserved by <main>). The empty
 * state also sits under the 48px screen header.
 */
const FULL_SCREEN = "min-h-[calc(100dvh-50px-env(safe-area-inset-bottom))]";
const UNDER_HEADER = "min-h-[calc(100dvh-48px-50px-env(safe-area-inset-bottom))]";

function Spinner() {
  return (
    <svg className="h-6 w-6 animate-spin text-text-secondary" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
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

const isUnread = (n: FollowRequest) => n.readAt === null;

export default function NotificationsPage() {
  const t = useT();
  const [data, setData] = useState<NotificationsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Unread when the page opened: keeps its dot while it is on screen, even
  // though the server counts it read from now on.
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    try {
      const result = await apiClient.followRequests.list();
      const all = [...result.pendingRequests, ...result.newFollowers];
      const fresh = all.filter((n) => isUnread(n) && !n.unreadKept);
      setFreshIds(new Set(fresh.map((n) => n.id)));
      // Seen: never-read items are read from now on; the badge goes
      void apiClient.followRequests.markSeen().catch(() => {});
      const now = new Date().toISOString();
      const readNow = (n: FollowRequest) => (isUnread(n) && !n.unreadKept ? { ...n, readAt: now } : n);
      setData({
        pendingRequests: result.pendingRequests.map(readNow),
        newFollowers: result.newFollowers.map(readNow),
      });
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

  const patch = (id: string, update: (n: FollowRequest) => FollowRequest | null) => {
    setData((prev) => {
      if (!prev) return prev;
      const apply = (list: FollowRequest[]) =>
        list.flatMap((n) => {
          if (n.id !== id) return [n];
          const next = update(n);
          return next ? [next] : [];
        });
      return { pendingRequests: apply(prev.pendingRequests), newFollowers: apply(prev.newFollowers) };
    });
  };

  async function handleAccept(id: string) {
    try {
      await apiClient.followRequests.accept(id);
      patch(id, () => null);
    } catch {
      // Error
    }
  }

  async function handleReject(id: string) {
    try {
      await apiClient.followRequests.reject(id);
      patch(id, () => null);
    } catch {
      // Error
    }
  }

  async function handleToggleRead(item: FollowRequest) {
    const read = isUnread(item); // unread → read, read → unread
    try {
      await apiClient.followRequests.setRead(item.id, read);
      setFreshIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
      patch(item.id, (n) => ({
        ...n,
        readAt: read ? new Date().toISOString() : null,
        unreadKept: !read,
      }));
    } catch {
      // Error
    }
  }

  async function handleDismiss(id: string) {
    try {
      await apiClient.followRequests.dismiss(id);
      patch(id, () => null);
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

  const rowClass = "-mx-4 border-b border-border lg:mx-0";
  const contentClass = "flex min-w-0 flex-1 items-center gap-3 px-4 py-3 lg:px-0";

  /** The unread dot — the app's device for state — or its empty place. */
  const dot = (item: FollowRequest) => (
    <span
      aria-hidden="true"
      className={`h-2 w-2 shrink-0 rounded-full ${
        isUnread(item) || freshIds.has(item.id) ? "bg-accent" : "bg-transparent"
      }`}
    />
  );

  const actions = (item: FollowRequest) => (
    <NotificationActions
      id={item.id}
      unread={isUnread(item)}
      onToggleRead={() => void handleToggleRead(item)}
      onDismiss={() => void handleDismiss(item.id)}
      labels={{
        read: t("notifications.markRead"),
        unread: t("notifications.markUnread"),
        remove: t("common.delete"),
      }}
    />
  );

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
                    <SwipeRow key={req.id} className={rowClass} actions={actions(req)}>
                      <div className={contentClass} data-testid={`notification-${req.id}`}>
                        {dot(req)}
                        <Link href={`/profile/${req.follower.username}`} className="shrink-0">
                          <Avatar url={req.follower.avatarUrl} name={req.follower.name} className="h-11 w-11 border border-border" />
                        </Link>

                        <Link href={`/profile/${req.follower.username}`} className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold text-text">
                            {req.follower.username}
                          </p>
                          <p className="truncate text-xs text-text-tertiary">{req.follower.name}</p>
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
                      </div>
                    </SwipeRow>
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
                    <SwipeRow key={follower.id} className={rowClass} actions={actions(follower)}>
                      <div className={contentClass} data-testid={`notification-${follower.id}`}>
                        {dot(follower)}
                        <Link href={`/profile/${follower.follower.username}`} className="shrink-0">
                          <Avatar url={follower.follower.avatarUrl} name={follower.follower.name} className="h-11 w-11 border border-border" />
                        </Link>

                        <Link href={`/profile/${follower.follower.username}`} className="min-w-0 flex-1">
                          <p className="text-[13px] text-text">
                            <span className="font-semibold">{follower.follower.username}</span>{" "}
                            <span className="text-text-secondary">{t("notifications.startedFollowing")}</span>
                          </p>
                        </Link>

                        <span className="shrink-0 text-xs text-text-tertiary">
                          {timeAgo(follower.createdAt)}
                        </span>
                      </div>
                    </SwipeRow>
                  ))}
                </ul>
              </>
            )}
          </div>
        ) : (
          <div className={`flex items-center justify-center pb-16 ${UNDER_HEADER} lg:min-h-0 lg:py-24`}>
            <p className="text-[15px] text-text-secondary">{t("notifications.noNotifications")}</p>
          </div>
        )}
      </div>
    </PullToRefresh>
  );
}

/**
 * The two actions a slide reveals: blue to flip read/unread (an envelope,
 * with a dot when it would mark unread), red with a bin to delete.
 */
function NotificationActions({
  id,
  unread,
  onToggleRead,
  onDismiss,
  labels,
}: {
  id: string;
  unread: boolean;
  onToggleRead: () => void;
  onDismiss: () => void;
  labels: { read: string; unread: string; remove: string };
}) {
  const button =
    "flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full transition-opacity hover:opacity-90";
  return (
    <>
      <button
        type="button"
        onClick={onToggleRead}
        data-testid={`toggle-read-${id}`}
        aria-label={unread ? labels.read : labels.unread}
        className={`${button} bg-accent text-on-accent`}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
          {unread ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9v.906a2.25 2.25 0 0 1-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 0 0 1.183 1.981l6.478 3.488m8.839 2.51-4.66-2.51m0 0-1.023-.55a2.25 2.25 0 0 0-2.134 0l-1.022.55m0 0-4.661 2.51m16.5 1.615a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V9a2.25 2.25 0 0 1 1.183-1.981l7.5-4.039a2.25 2.25 0 0 1 2.134 0l7.5 4.039A2.25 2.25 0 0 1 21.75 9Z" />
          ) : (
            <>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              <circle cx="19" cy="5" r="3.5" fill="currentColor" stroke="var(--color-accent)" strokeWidth="2" />
            </>
          )}
        </svg>
      </button>
      <button
        type="button"
        onClick={onDismiss}
        data-testid={`dismiss-${id}`}
        aria-label={labels.remove}
        className={`${button} bg-error text-white`}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
        </svg>
      </button>
    </>
  );
}
