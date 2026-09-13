// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, fireEvent, render, waitFor, screen } from "@testing-library/react";
import React from "react";

// ─── Mocks ────────────────────────────────────────────────────────────

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    replace: vi.fn(),
  }),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: React.PropsWithChildren<{ href?: string } & Record<string, unknown>>) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("next/dynamic", () => ({
  default: () => {
    return function DynamicMock() {
      return React.createElement("div", { "data-testid": "mini-map" });
    };
  },
}));

const mockSpotsGet = vi.fn();
const mockSpotsListPhotos = vi.fn().mockResolvedValue({ items: [], nextCursor: null });
const mockSpotsDelete = vi.fn();
const mockSpotsUploadPhoto = vi.fn();
const mockSpotsLike = vi.fn();
const mockSpotsUnlike = vi.fn();

vi.mock("@/lib/api-client", () => ({
  apiClient: {
    spots: {
      get: (...args: unknown[]) => mockSpotsGet(...args),
      listPhotos: (...args: unknown[]) => mockSpotsListPhotos(...args),
      delete: (...args: unknown[]) => mockSpotsDelete(...args),
      uploadPhoto: (...args: unknown[]) => mockSpotsUploadPhoto(...args),
      like: (...args: unknown[]) => mockSpotsLike(...args),
      unlike: (...args: unknown[]) => mockSpotsUnlike(...args),
    },
  },
  ACCEPTED_IMAGE_TYPES: ["image/jpeg", "image/png"],
}));

// The app's own dialog, answered by the test
const mockConfirm = vi.fn();
vi.mock("@/components/dialog", () => ({
  confirmDialog: (...args: unknown[]) => mockConfirm(...args),
  noticeDialog: vi.fn(),
}));

vi.mock("@trs/shared/constants", () => ({
  ACCEPTED_IMAGE_TYPES: ["image/jpeg", "image/png"],
  MAX_PHOTO_SIZE_BYTES: 5 * 1024 * 1024,
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ user: { id: "user-1", username: "alice" } }),
}));

vi.mock("@/lib/use-t", () => ({
  useT: () => (key: string) => key,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
    React.createElement("button", props, children),
}));

vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: (props: Record<string, unknown>) =>
    React.createElement("div", { "data-testid": "skeleton", ...props }),
}));

// ─── Component import ─────────────────────────────────────────────────

import SpotDetailPage from "../page";

// ─── Test fixtures ────────────────────────────────────────────────────

const MOCK_SPOT = {
  id: "spot-1",
  userId: "user-1",
  latitude: 48.8566,
  longitude: 2.3522,
  address: "Paris, France",
  city: "Paris",
  country: "France",
  photoUrl: "https://example.com/photo.jpg",
  photoKey: "photos/photo.jpg",
  title: "Eiffel Tower",
  description: "Beautiful view",
  isFree: true,
  priceInfo: null,
  visibility: "FOLLOWERS" as const,
  customComposition: null,
  colors: ["#FF0000"],
  compositions: ["SYMMETRY"],
  tags: ["paris"],
  images: [
    { id: "img-1", photoUrl: "https://example.com/1.jpg", photoKey: "k1", order: 0 },
    { id: "img-2", photoUrl: "https://example.com/2.jpg", photoKey: "k2", order: 1 },
  ],
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  user: {
    id: "user-1",
    email: "alice@example.com",
    username: "alice",
    name: "Alice",
    avatarUrl: null,
    bio: null,
    locale: "en",
    provider: "EMAIL",
    createdAt: "2024-01-01T00:00:00Z",
  },
};

function renderPage() {
  const params = Promise.resolve({ id: "spot-1" });
  return render(<SpotDetailPage params={params} />);
}

// ─── Tests ────────────────────────────────────────────────────────────

describe("SpotDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading skeleton then spot details without hooks error", async () => {
    mockSpotsGet.mockResolvedValue(MOCK_SPOT);

    renderPage();

    // Should eventually show spot title
    await waitFor(() => {
      expect(screen.getByText("Eiffel Tower")).toBeInTheDocument();
    });
  });

  it("handles loading → loaded transition (hooks order regression)", async () => {
    // Same critical regression test: the web component must not have
    // hooks placed after early returns. If it does, this test will
    // crash with React's "Rendered more hooks" error.
    let resolveFetch!: (value: unknown) => void;
    mockSpotsGet.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );

    renderPage();

    // Loading state — skeleton should appear
    await waitFor(() => {
      expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
    });
    // The skeleton shows before the effect asks for the spot: wait for the
    // request itself, or there is nothing to resolve yet on a slow run
    await waitFor(() => expect(mockSpotsGet).toHaveBeenCalled());

    // Resolve → component transitions to loaded state
    resolveFetch(MOCK_SPOT);

    await waitFor(() => {
      expect(screen.getByText("Eiffel Tower")).toBeInTheDocument();
    });
  });

  it("renders error state", async () => {
    mockSpotsGet.mockRejectedValue(new Error("Not found"));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Not found")).toBeInTheDocument();
    });
  });

  it("shows image carousel counter for multi-image spots", async () => {
    mockSpotsGet.mockResolvedValue(MOCK_SPOT);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("1/2")).toBeInTheDocument();
    });
  });

  it("does not show carousel for single image spots", async () => {
    mockSpotsGet.mockResolvedValue({ ...MOCK_SPOT, images: [] });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Eiffel Tower")).toBeInTheDocument();
    });

    // No counter badge
    expect(screen.queryByText(/1\/1/)).not.toBeInTheDocument();
  });
});

// ─── Likes, the two-step delete, the map's stacking and the lightbox ──

// The expanded map builds a real MapLibre map; jsdom has no WebGL for it
vi.mock("maplibre-gl", async () => (await import("@/test/maplibre-mock")).createMapLibreMock());

describe("SpotDetailPage — likes, deleting, map and photo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSpotsGet.mockResolvedValue({ ...MOCK_SPOT, likeCount: 5, isLiked: false });
    mockSpotsListPhotos.mockResolvedValue({ items: [], nextCursor: null });
    mockSpotsLike.mockResolvedValue({ isLiked: true, likeCount: 6 });
    mockSpotsUnlike.mockResolvedValue({ isLiked: false, likeCount: 5 });
    mockSpotsDelete.mockResolvedValue(undefined);
  });

  it("asks twice before deleting, in the app's own dialog", async () => {
    mockConfirm.mockResolvedValue(true);
    renderPage();
    await screen.findByText("Eiffel Tower");

    fireEvent.click(screen.getByRole("button", { name: "common.delete" }));

    await waitFor(() => expect(mockSpotsDelete).toHaveBeenCalledWith("spot-1"));
    expect(mockConfirm).toHaveBeenCalledTimes(2);
    expect(mockConfirm.mock.calls[0][0]).toMatchObject({ title: "spots.deleteConfirm", destructive: true });
    expect(mockConfirm.mock.calls[1][0]).toMatchObject({
      title: "spots.deleteConfirmAgain",
      confirmLabel: "spots.deleteForGood",
      destructive: true,
    });
  });

  it("keeps the spot when the second question is answered no", async () => {
    mockConfirm.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    renderPage();
    await screen.findByText("Eiffel Tower");

    fireEvent.click(screen.getByRole("button", { name: "common.delete" }));

    await waitFor(() => expect(mockConfirm).toHaveBeenCalledTimes(2));
    expect(mockSpotsDelete).not.toHaveBeenCalled();
  });

  it("likes at once, settles on the server's count, and unlikes again", async () => {
    renderPage();
    await screen.findByText("Eiffel Tower");
    expect(screen.getByTestId("like-count").textContent).toBe("5");

    await act(async () => {
      fireEvent.click(screen.getByTestId("like-spot"));
    });
    expect(screen.getByTestId("like-count").textContent).toBe("6");
    expect(screen.getByTestId("like-spot").getAttribute("aria-pressed")).toBe("true");
    await waitFor(() => expect(mockSpotsLike).toHaveBeenCalledWith("spot-1"));

    await act(async () => {
      fireEvent.click(screen.getByTestId("like-spot"));
    });
    await waitFor(() => expect(mockSpotsUnlike).toHaveBeenCalledWith("spot-1"));
    expect(screen.getByTestId("like-count").textContent).toBe("5");
  });

  it("puts the heart back when the server refuses", async () => {
    mockSpotsLike.mockRejectedValueOnce(new Error("offline"));
    renderPage();
    await screen.findByText("Eiffel Tower");

    await act(async () => {
      fireEvent.click(screen.getByTestId("like-spot"));
    });
    await waitFor(() => expect(screen.getByTestId("like-count").textContent).toBe("5"));
    expect(screen.getByTestId("like-spot").getAttribute("aria-pressed")).toBe("false");
  });

  it("keeps the mini map's layers under the nav and the expanded map", async () => {
    renderPage();
    await screen.findByText("Eiffel Tower");

    // The map stacks its own controls high: a stacking context keeps them inside the thumb
    const thumb = screen.getByRole("button", { name: "map.tapToExpand" });
    expect(thumb.className.split(" ")).toContain("isolate");

    await act(async () => {
      fireEvent.click(thumb);
    });
    // …and the expanded map sits above the bottom nav (z-50) and those panes
    expect(screen.getByTestId("expanded-map").className.split(" ")).toContain("z-[1100]");
  });

  it("opens the photo full screen from a tap and closes it with Escape", async () => {
    renderPage();
    await screen.findByText("Eiffel Tower");
    expect(screen.queryByTestId("lightbox")).toBeNull();

    await act(async () => {
      fireEvent.click(screen.getByTestId("spot-photo-0"));
    });
    const img = screen.getByTestId("lightbox-image") as HTMLImageElement;
    expect(img.src).toBe(MOCK_SPOT.images[0].photoUrl);

    await act(async () => {
      fireEvent.keyDown(document, { key: "Escape" });
    });
    expect(screen.queryByTestId("lightbox")).toBeNull();
  });
});
