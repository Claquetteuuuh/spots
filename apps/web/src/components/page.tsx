"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

/**
 * The app has exactly two content widths, and every page uses one of them.
 *
 * Before this there were five different `max-w-*` values across the pages and
 * a sixth on the nav bar, so no two screens lined up with each other — the
 * spot detail page even changed width between its loading and loaded states.
 *
 * `PAGE_COLUMN` is a single reading column: settings, feeds, forms, lists.
 * `PAGE_WIDE` is for grids of photographs, and matches the nav bar's width so
 * the logo sits directly above the content.
 */
export const PAGE_COLUMN = "mx-auto w-full max-w-xl px-4";
export const PAGE_WIDE = "mx-auto w-full max-w-4xl px-4";

function BackArrow() {
  return (
    <svg
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
      />
    </svg>
  );
}

/**
 * A page's title.
 *
 * On a phone this is the familiar sticky bar with a back arrow, docked under
 * the nav. On a desktop that same bar was a second header stacked under the
 * real one, and its arrow duplicated navigation already on screen — so there
 * it becomes a plain heading in the flow of the page.
 */
export function PageHeader({
  title,
  onBack,
  actions,
}: {
  title: string;
  /** Defaults to browser back. Only ever shown on small screens. */
  onBack?: () => void;
  actions?: ReactNode;
}) {
  const router = useRouter();

  return (
    <div
      className="sticky top-14 z-10 -mx-4 flex h-12 items-center gap-3 border-b border-border bg-bg px-4
        md:static md:mx-0 md:h-auto md:border-0 md:px-0 md:pb-3 md:pt-8"
    >
      <button
        type="button"
        onClick={onBack ?? (() => router.back())}
        aria-label={title}
        className="-ml-1 cursor-pointer rounded-full p-1 text-text md:hidden"
      >
        <BackArrow />
      </button>
      <h1 className="flex-1 truncate text-base font-semibold text-text md:text-2xl">
        {title}
      </h1>
      {actions}
    </div>
  );
}
