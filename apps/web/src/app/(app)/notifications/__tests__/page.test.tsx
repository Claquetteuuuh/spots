/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("@/lib/use-t", () => ({ useT: () => (key: string) => key }));
vi.mock("@/components/avatar", () => ({ Avatar: () => <span data-testid="avatar" /> }));
vi.mock("@/components/pull-to-refresh", () => ({
  PullToRefresh: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/page", () => ({
  PAGE_COLUMN: "col",
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

const { api } = vi.hoisted(() => ({
  api: {
    list: vi.fn(),
    markSeen: vi.fn(),
    accept: vi.fn(),
    reject: vi.fn(),
    setRead: vi.fn(),
    dismiss: vi.fn(),
  },
}));
vi.mock("@/lib/api-client", () => ({ apiClient: { followRequests: api } }));

import NotificationsPage from "../page";

const follower = (id: string) => ({ id, username: `u-${id}`, name: `N ${id}`, avatarUrl: null });
const item = (id: string, extra: Partial<{ readAt: string | null; unreadKept: boolean }> = {}) => ({
  id,
  follower: follower(id),
  createdAt: new Date().toISOString(),
  readAt: null,
  unreadKept: false,
  ...extra,
});

async function renderPage() {
  await act(async () => {
    render(<NotificationsPage />);
  });
  await waitFor(() => expect(screen.getByText("notifications.title")).toBeTruthy());
}

const dotOf = (id: string) => screen.getByTestId(`notification-${id}`).querySelector("span");

beforeEach(() => {
  vi.clearAllMocks();
  api.list.mockResolvedValue({
    pendingRequests: [item("p1")],
    newFollowers: [item("f1", { readAt: "2026-01-01T00:00:00.000Z" })],
    likes: [],
  });
  api.markSeen.mockResolvedValue(undefined);
  api.setRead.mockResolvedValue(undefined);
  api.dismiss.mockResolvedValue(undefined);
});

describe("NotificationsPage", () => {
  it("reads the page on open, keeping the dot on what was new", async () => {
    await renderPage();

    expect(api.markSeen).toHaveBeenCalledTimes(1);
    expect(dotOf("p1")?.className).toContain("bg-accent");
    expect(dotOf("f1")?.className).toContain("bg-transparent");
  });

  it("deletes a notification from its red action", async () => {
    await renderPage();

    await act(async () => {
      fireEvent.click(screen.getAllByTestId("dismiss-p1")[0]);
    });

    expect(api.dismiss).toHaveBeenCalledWith("p1");
    await waitFor(() => expect(screen.queryByTestId("notification-p1")).toBeNull());
    expect(screen.getByTestId("notification-f1")).toBeTruthy();
  });

  it("marks a read notification unread from its blue action, then read again", async () => {
    await renderPage();

    // f1 was read: its blue action offers "mark unread"
    const [f1Toggle] = screen.getAllByTestId("toggle-read-f1");
    expect(f1Toggle.getAttribute("aria-label")).toBe("notifications.markUnread");
    await act(async () => {
      fireEvent.click(f1Toggle);
    });
    expect(api.setRead).toHaveBeenCalledWith("f1", false);
    await waitFor(() => expect(dotOf("f1")?.className).toContain("bg-accent"));

    // Now it offers "mark read"
    const [f1Again] = screen.getAllByTestId("toggle-read-f1");
    expect(f1Again.getAttribute("aria-label")).toBe("notifications.markRead");
    await act(async () => {
      fireEvent.click(f1Again);
    });
    expect(api.setRead).toHaveBeenLastCalledWith("f1", true);
  });
});

describe("NotificationsPage — likes", () => {
  it("lists who liked a spot, links to it, and slides like the rest", async () => {
    api.list.mockResolvedValue({
      pendingRequests: [],
      newFollowers: [],
      likes: [
        {
          id: "l1",
          user: follower("l1"),
          spot: { id: "s9", title: "Seine at dusk", photoUrl: "https://cdn/s9.webp" },
          createdAt: new Date().toISOString(),
          readAt: null,
          unreadKept: false,
        },
      ],
    });
    await renderPage();

    const row = screen.getByTestId("notification-l1");
    expect(screen.getByText("notifications.likes")).toBeTruthy();
    expect(screen.getByText("notifications.likedSpot")).toBeTruthy();
    expect(screen.getByText("Seine at dusk").closest("a")?.getAttribute("href")).toBe("/spot/s9");
    expect(row.querySelector("img")?.getAttribute("src")).toBe("https://cdn/s9.webp");
    expect(dotOf("l1")?.className).toContain("bg-accent");

    await act(async () => {
      fireEvent.click(screen.getAllByTestId("dismiss-l1")[0]);
    });
    await waitFor(() => expect(api.dismiss).toHaveBeenCalledWith("l1"));
    await waitFor(() => expect(screen.queryByTestId("notification-l1")).toBeNull());
  });
});
