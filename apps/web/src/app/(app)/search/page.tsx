"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import type { User } from "@/lib/api-client";
import { useT } from "@/lib/use-t";

export default function SearchPage() {
  const t = useT();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const q = query.trim();
      if (!q) return;

      setIsLoading(true);
      try {
        const users = await apiClient.users.search(q);
        setResults(users);
        setHasSearched(true);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [query],
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Pill-shaped search bar */}
      <form onSubmit={handleSearch}>
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("users.searchPlaceholder")}
            className="w-full rounded-full bg-bg-secondary border border-border pl-11 pr-4 py-2.5 text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
          />
        </div>
      </form>

      {/* Results */}
      <div className="mt-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <svg className="h-5 w-5 animate-spin text-text-tertiary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : hasSearched && results.length === 0 ? (
          <p className="text-center text-text-secondary py-8">
            {t("users.noResults")}
          </p>
        ) : (
          <div className="divide-y divide-border">
            {results.map((user) => (
              <Link
                key={user.id}
                href={`/profile/${user.username}`}
                className="flex items-center gap-3 px-2 py-3 hover:bg-bg-secondary transition-colors rounded-2xl -mx-2"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="h-11 w-11 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-on-accent text-sm font-semibold">
                    {user.name?.charAt(0)?.toUpperCase() ?? "?"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text truncate">
                    {user.username}
                  </p>
                  <p className="text-sm text-text-tertiary truncate">
                    {user.name}
                  </p>
                </div>
                {user._count ? (
                  <span className="text-xs text-text-tertiary">
                    {t("users.spots", {
                      count: String(user._count.spots),
                    })}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
