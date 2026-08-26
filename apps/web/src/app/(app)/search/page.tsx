"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import type { User } from "@/lib/api-client";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";

export default function SearchPage() {
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
      } catch {
        // Silently fail
      } finally {
        setIsLoading(false);
      }
    },
    [query],
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">
        {t("common.search")}
      </h1>

      <form onSubmit={handleSearch} className="mt-6">
        <Input
          label=""
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("users.searchPlaceholder")}
        />
      </form>

      {/* Results */}
      <div className="mt-8">
        {isLoading ? (
          <p className="text-center text-text-tertiary">
            {t("common.loading")}
          </p>
        ) : hasSearched && results.length === 0 ? (
          <p className="text-center text-text-secondary py-8">
            {t("users.noResults")}
          </p>
        ) : (
          <div className="space-y-1">
            {results.map((user) => (
              <Link
                key={user.id}
                href={`/profile/${user.username}`}
                className="flex items-center gap-3 rounded-sm px-3 py-3 hover:bg-bg-secondary transition-colors"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="h-10 w-10 rounded-sm object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-accent text-white text-sm font-medium">
                    {user.name?.charAt(0)?.toUpperCase() ?? "?"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-text-tertiary truncate">
                    @{user.username}
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
