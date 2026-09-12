// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.PropsWithChildren<{ href?: string } & Record<string, unknown>>) =>
    React.createElement("a", { href, ...props }, children),
}));
vi.mock("@/lib/use-t", () => ({ useT: () => (key: string) => key }));
vi.mock("@/components/page", () => ({
  PAGE_COLUMN: "page",
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

const mockActivity = vi.fn();
vi.mock("@/lib/api-client", () => ({
  apiClient: { me: { activity: (...args: unknown[]) => mockActivity(...args) } },
}));

import ActivityPage from "../page";

const spot = (id: string, title: string | null = "Seine at dusk") => ({
  id,
  title,
  photoUrl: `https://cdn/${id}.webp`,
  city: "Paris",
  country: "France",
  userId: "u2",
  user: { id: "u2", username: "bob", name: "Bob", avatarUrl: null },
});

const mount = () =>
  act(async () => {
    render(<ActivityPage />);
  });

describe("ActivityPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockActivity.mockImplementation(async (type: string, cursor?: string) =>
      type === "likes"
        ? {
            items: cursor
              ? [{ id: "l3", createdAt: "2026-01-01", spot: spot("s3") }]
              : [
                  { id: "l1", createdAt: "2026-01-01", spot: spot("s1") },
                  { id: "l2", createdAt: "2026-01-01", spot: spot("s2", null) },
                ],
            nextCursor: cursor ? null : "l2",
          }
        : { items: [{ id: "p1", photoUrl: "https://cdn/p1.webp", caption: "Golden hour", createdAt: "2026-01-01", spot: spot("s9") }], nextCursor: null },
    );
  });

  it("opens on the liked spots, each linking to its spot, with a way to load more", async () => {
    await mount();
    await waitFor(() => expect(screen.getByTestId("activity-l1")).toBeTruthy());

    expect(mockActivity).toHaveBeenCalledWith("likes", undefined);
    expect(screen.getByTestId("activity-l1").querySelector("a")?.getAttribute("href")).toBe("/spot/s1");
    expect(screen.getByText("Seine at dusk")).toBeTruthy();
    expect(screen.getByText("spots.untitled")).toBeTruthy();
    expect(screen.getAllByText("Paris, France · @bob")).toHaveLength(2);

    await act(async () => {
      fireEvent.click(screen.getByTestId("activity-more"));
    });
    await waitFor(() => expect(screen.getByTestId("activity-l3")).toBeTruthy());
    expect(mockActivity).toHaveBeenLastCalledWith("likes", "l2");
    expect(screen.getByTestId("activity-l1")).toBeTruthy(); // the first page stays
    expect(screen.queryByTestId("activity-more")).toBeNull();
  });

  it("switches to the photos, showing the caption and the spot it sits on", async () => {
    await mount();
    await waitFor(() => expect(screen.getByTestId("activity-l1")).toBeTruthy());

    await act(async () => {
      fireEvent.click(screen.getByTestId("activity-tab-photos"));
    });
    await waitFor(() => expect(screen.getByTestId("activity-p1")).toBeTruthy());
    expect(mockActivity).toHaveBeenLastCalledWith("photos", undefined);
    expect(screen.getByText("Golden hour")).toBeTruthy();
    expect(screen.getByText("settings.activityOn Seine at dusk · @bob")).toBeTruthy();
    expect(screen.getByTestId("activity-p1").querySelector("img")?.getAttribute("src")).toBe("https://cdn/p1.webp");
    expect(screen.queryByTestId("activity-l1")).toBeNull();
  });

  it("says so when there is nothing yet", async () => {
    mockActivity.mockResolvedValue({ items: [], nextCursor: null });
    await mount();
    await waitFor(() => expect(screen.getByText("settings.activityEmptyLikes")).toBeTruthy());
  });
});
