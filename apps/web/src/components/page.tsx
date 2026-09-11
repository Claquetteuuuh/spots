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
 *
 * Both only cap their width from `lg` up. Below that — phones and tablets —
 * the page is the screen edge to edge, the way the mobile app is on an iPad.
 */
export const PAGE_COLUMN = "mx-auto w-full px-4 lg:max-w-xl";
export const PAGE_WIDE = "mx-auto w-full px-4 lg:max-w-4xl";

/** iOS-style chevron (Ionicons `chevron-back`), the app's back affordance. */
function BackChevron() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 512 512" fill="none" aria-hidden="true">
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={48}
        d="M328 112L184 256l144 144"
      />
    </svg>
  );
}

/**
 * A screen's header.
 *
 * Below `lg` the global nav bar is hidden — like the app, every screen owns
 * its top edge — so this is the app's screen header: a 48px bar docked at the
 * top with a hairline underneath, a 16px semibold title and, for screens you
 * push onto a stack (a spot, someone's profile), a back chevron. Tab-level
 * screens (notifications, settings) pass `back={false}` — the app shows no
 * back control on a tab.
 *
 * From `lg` the bar would sit under the real header and its chevron would
 * duplicate navigation already on screen, so it becomes a plain heading in
 * the flow of the page.
 */
export function PageHeader({
  title,
  onBack,
  back = true,
  actions,
}: {
  title: string;
  /** Defaults to browser back. Only ever shown below `lg`. */
  onBack?: () => void;
  /** Tab-level screens have no back control. */
  back?: boolean;
  actions?: ReactNode;
}) {
  const router = useRouter();

  return (
    <div
      className="sticky top-0 z-10 -mx-4 flex h-12 items-center gap-2 border-b border-border bg-bg px-4
        lg:static lg:mx-0 lg:h-auto lg:border-0 lg:px-0 lg:pb-3 lg:pt-8"
    >
      {back ? (
        <button
          type="button"
          onClick={onBack ?? (() => router.back())}
          aria-label={title}
          className="-ml-2 cursor-pointer rounded-full p-1 text-text lg:hidden"
        >
          <BackChevron />
        </button>
      ) : null}
      <h1 className="flex-1 truncate text-base font-semibold text-text lg:text-2xl">
        {title}
      </h1>
      {actions}
    </div>
  );
}
