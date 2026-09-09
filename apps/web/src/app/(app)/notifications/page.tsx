"use client";

import { startTransition, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import type { FollowRequest } from "@/lib/api-client";
import { useT } from "@/lib/use-t";
import { PullToRefresh } from "@/components/pull-to-refresh";

export default function NotificationsPage() {
  const t = useT();
  const [requests, setRequests] = useState<FollowRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.followRequests.list();
      setRequests(data);
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    startTransition(() => {
      loadRequests();
    });
  }, [loadRequests]);

  async function handleAccept(id: string) {
    try {
      await apiClient.followRequests.accept(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // Error
    }
  }

  async function handleReject(id: string) {
    try {
      await apiClient.followRequests.reject(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // Error
    }
  }

  return (
    <PullToRefresh onRefresh={loadRequests}>
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-bg px-4 h-12 flex items-center">
          <h1 className="text-base font-semibold text-text">{t("notifications.title")}</h1>
        </div>

        {/* Follow requests section */}
        {requests.length > 0 ? (
          <div>
            <div className="px-4 pt-4 pb-2">
              <p className="text-sm font-semibold text-text">
                {t("notifications.followRequests")}
              </p>
            </div>

            {requests.map((req) => (
              <div
                key={req.id}
                className="flex items-center gap-3 px-4 py-3"
              >
                <Link href={`/profile/${req.follower.username}`} className="shrink-0">
                  {req.follower.avatarUrl ? (
                    <img
                      src={req.follower.avatarUrl}
                      alt=""
                      className="h-11 w-11 rounded-full object-cover border border-border"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-white text-sm font-semibold">
                      {req.follower.name?.charAt(0)?.toUpperCase() ?? "?"}
                    </div>
                  )}
                </Link>

                <div className="flex-1 min-w-0">
                  <Link href={`/profile/${req.follower.username}`}>
                    <p className="text-sm font-semibold text-text truncate">
                      {req.follower.username}
                    </p>
                    <p className="text-xs text-text-tertiary truncate">
                      {req.follower.name}
                    </p>
                  </Link>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleAccept(req.id)}
                    className="rounded bg-accent px-4 py-1.5 text-xs font-semibold text-white hover:bg-accent-dark transition-colors cursor-pointer"
                  >
                    {t("notifications.accept")}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(req.id)}
                    className="rounded bg-bg-secondary px-4 py-1.5 text-xs font-semibold text-text border border-border hover:bg-bg-tertiary transition-colors cursor-pointer"
                  >
                    {t("notifications.reject")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : !isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <svg className="h-16 w-16 text-text-tertiary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
            <p className="text-sm text-text-secondary">{t("notifications.noNotifications")}</p>
          </div>
        ) : null}

        {/* Loading */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <svg className="h-6 w-6 animate-spin text-text-tertiary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : null}
      </div>
    </PullToRefresh>
  );
}
