"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import type { FollowStatus, SuggestedUser, User } from "@/lib/api-client";
import { useRecentUsers, type RecentUser } from "@/lib/recent-users";
import { useAuth } from "@/lib/auth-context";
import { useT } from "@/lib/use-t";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";
import { PAGE_COLUMN } from "@/components/page";

/** Same delay as the app's SearchScreen. */
const SEARCH_DEBOUNCE_MS = 350;

/** The API sends `followStatus`; older payloads only carried `isFollowing`. */
function followStateOf(user: User): FollowStatus {
  return user.followStatus ?? (user.isFollowing ? "ACCEPTED" : null);
}

export default function SearchPage() {
  const t = useT();
  const { user: currentUser } = useAuth();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  // The query the current `results` answer, so the empty state only shows
  // once a search for what's typed has actually come back.
  const [searchedQuery, setSearchedQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  // With nothing typed: who was looked up here lately, and who might be worth knowing
  const { recent, remember, forget, clear: clearRecent } = useRecentUsers();
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve()
      .then(() => apiClient.users.suggestions())
      .then((list) => {
        if (!cancelled) setSuggestions(list);
      })
      .catch(() => {
        // No suggestions is not an error worth a message
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Ignore responses that arrive after a newer search was started.
  const searchSeq = useRef(0);

  const runSearch = useCallback(async (value: string) => {
    const q = value.trim();
    const seq = ++searchSeq.current;

    if (q.length === 0) {
      setResults([]);
      setSearchedQuery("");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const users = await apiClient.users.search(q);
      if (seq !== searchSeq.current) return;
      setResults(users);
    } catch {
      if (seq !== searchSeq.current) return;
      setResults([]);
    } finally {
      if (seq === searchSeq.current) {
        setSearchedQuery(q);
        setIsLoading(false);
      }
    }
  }, []);

  // Live search as you type, debounced like the app.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void runSearch(query);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  // Enter searches right away and, like the app's return key, puts the
  // keyboard away.
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    inputRef.current?.blur();
    void runSearch(query);
  }

  function patchFollowState(id: string, status: FollowStatus) {
    const patch = <T extends User>(u: T): T =>
      u.id === id ? { ...u, followStatus: status, isFollowing: status === "ACCEPTED" } : u;
    setResults((prev) => prev.map(patch));
    setSuggestions((prev) => prev.map(patch));
  }

  async function toggleFollow(user: User) {
    const prevStatus = followStateOf(user);
    // Optimistic: a private account goes to "requested", a public one
    // straight to following; the server's answer settles it below.
    const optimistic: FollowStatus = prevStatus
      ? null
      : user.isPrivate
        ? "PENDING"
        : "ACCEPTED";

    setPendingIds((prev) => new Set(prev).add(user.id));
    patchFollowState(user.id, optimistic);

    try {
      if (prevStatus) {
        await apiClient.users.unfollow(user.username);
      } else {
        const { status } = await apiClient.users.follow(user.username);
        patchFollowState(user.id, status);
      }
    } catch {
      patchFollowState(user.id, prevStatus);
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(user.id);
        return next;
      });
    }
  }

  function followLabel(status: FollowStatus): string {
    if (status === "ACCEPTED") return t("users.unfollow");
    if (status === "PENDING") return t("notifications.requested");
    return t("users.follow");
  }

  const trimmedQuery = query.trim();
  const showEmpty =
    trimmedQuery.length > 0 &&
    searchedQuery === trimmedQuery &&
    results.length === 0;

  return (
    <div className={PAGE_COLUMN}>
      {/* The app's search screen has no title: just the pill, docked at the
          top of the screen. */}
      <form onSubmit={handleSubmit} className="pt-4 pb-3 lg:pt-8">
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("users.searchPlaceholder")}
          autoCapitalize="none"
          autoComplete="off"
          enterKeyHint="search"
          className="w-full rounded-full bg-bg-secondary px-6 py-3 text-[15px] text-text placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent [&::-webkit-search-cancel-button]:hidden"
        />
      </form>

      {isLoading ? (
        <div className="mt-6 flex justify-center">
          <svg className="h-5 w-5 animate-spin text-text-secondary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : showEmpty ? (
        <p className="mt-12 text-center text-[15px] text-text-secondary">
          {t("users.noResults")}
        </p>
      ) : trimmedQuery.length === 0 ? (
        <>
          {recent.length > 0 ? (
            <section className="mt-2">
              <div className="flex items-center justify-between">
                <SectionTitle>{t("users.recent")}</SectionTitle>
                <button
                  type="button"
                  onClick={clearRecent}
                  className="text-xs font-medium text-text-secondary transition-colors cursor-pointer hover:text-text"
                >
                  {t("users.clearRecent")}
                </button>
              </div>
              <ul>
                {recent.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onOpen={() => remember(user)}
                    action={
                      <button
                        type="button"
                        onClick={() => forget(user.id)}
                        aria-label={`${t("users.removeRecent")} ${user.username}`}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-tertiary transition-colors cursor-pointer hover:bg-bg-secondary hover:text-text"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    }
                  />
                ))}
              </ul>
            </section>
          ) : null}

          {suggestions.length > 0 ? (
            <section className="mt-4">
              <SectionTitle>{t("users.suggestions")}</SectionTitle>
              <ul>
                {suggestions.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    reason={suggestionReason(user, t)}
                    onOpen={() => remember(user)}
                    action={followButton(user)}
                  />
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : (
        <ul>
          {results.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              onOpen={() => remember(user)}
              action={followButton(user)}
            />
          ))}
        </ul>
      )}
    </div>
  );

  function followButton(user: User) {
    if (user.id === currentUser?.id) return null;
    const status = followStateOf(user);
    return (
      <Button
        type="button"
        variant={status ? "secondary" : "primary"}
        loading={pendingIds.has(user.id)}
        onClick={() => void toggleFollow(user)}
        className="shrink-0"
      >
        {followLabel(status)}
      </Button>
    );
  }
}

/** "Followed by alice and 3 more" — why someone is suggested. */
function suggestionReason(
  user: SuggestedUser,
  t: (key: string, vars?: Record<string, string>) => string,
): string | null {
  if (user.mutualUsernames.length === 0) return null;
  const names = user.mutualUsernames.join(", ");
  const more = user.mutualCount - user.mutualUsernames.length;
  return more > 0
    ? t("users.followedByMore", { names, count: String(more) })
    : t("users.followedBy", { names });
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="py-2 text-xs font-medium uppercase tracking-[0.5px] text-text-secondary">
      {children}
    </h2>
  );
}

/** One person: avatar, names, an optional reason, and whatever action fits. */
function UserRow({
  user,
  reason,
  onOpen,
  action,
}: {
  user: RecentUser;
  reason?: string | null;
  onOpen: () => void;
  action: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-3 border-b border-border py-3">
      <Link
        href={`/profile/${user.username}`}
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-3 transition-opacity active:opacity-70"
      >
        <Avatar url={user.avatarUrl} name={user.name} className="h-11 w-11 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-text">{user.username}</p>
          <p className="truncate text-[13px] text-text-secondary">{user.name}</p>
          {reason ? <p className="truncate text-xs text-text-tertiary">{reason}</p> : null}
        </div>
      </Link>
      {action}
    </li>
  );
}
