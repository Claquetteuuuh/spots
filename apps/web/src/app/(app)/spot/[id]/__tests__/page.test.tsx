// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor, screen } from "@testing-library/react";
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

vi.mock("@/lib/api-client", () => ({
  apiClient: {
    spots: {
      get: (...args: unknown[]) => mockSpotsGet(...args),
      listPhotos: (...args: unknown[]) => mockSpotsListPhotos(...args),
      delete: (...args: unknown[]) => mockSpotsDelete(...args),
      uploadPhoto: (...args: unknown[]) => mockSpotsUploadPhoto(...args),
    },
  },
  ACCEPTED_IMAGE_TYPES: ["image/jpeg", "image/png"],
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
