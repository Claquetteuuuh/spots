/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MAP_PINS_LIMIT, padBounds, type MapBounds, type MapPin } from "@trs/shared/map";

// ─── Mocks ──────────────────────────────────────────────────────────

/** The props the page last handed to the (mocked) map. */
const { mapProps } = vi.hoisted(() => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mapProps: { current: null as any },
}));

// `dynamic(() => import("@/components/spot-map"))` → a stub that records its props.
vi.mock("next/dynamic", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: () => (props: any) => {
    mapProps.current = props;
    return null;
  },
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn() }),
}));

vi.mock("@/lib/use-t", () => ({
  useT: () => (key: string) => key,
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ user: { id: "owner-1", username: "alice" } }),
}));

const mockMapFetch = vi.fn();
vi.mock("@/lib/api-client", () => ({
  apiClient: { spots: { map: (...args: unknown[]) => mockMapFetch(...args) } },
}));

import MapPage from "../page";

// ─── Fixtures ───────────────────────────────────────────────────────

const VIEW: MapBounds = { swLat: 48.8, swLng: 2.2, neLat: 48.9, neLng: 2.4 };
const PADDED = padBounds(VIEW);
/** A view well inside VIEW's padded box. */
const INNER: MapBounds = { swLat: 48.82, swLng: 2.25, neLat: 48.88, neLng: 2.35 };
/** Lyon — nowhere near. */
const FAR: MapBounds = { swLat: 45.7, swLng: 4.8, neLat: 45.8, neLng: 4.9 };

const PIN: MapPin = {
  id: "s1",
  latitude: 48.85,
  longitude: 2.35,
  title: "Bridge",
  photoUrl: "https://cdn.example.com/s1.jpg",
  city: "Paris",
  userId: "owner-1",
  isOwn: true,
};

// ─── Helpers ────────────────────────────────────────────────────────

async function renderPage() {
  await act(async () => {
    render(<MapPage />);
  });
  await waitFor(() => expect(mapProps.current).not.toBeNull());
}

async function moveTo(bounds: MapBounds, zoom = 12) {
  await act(async () => {
    mapProps.current.onViewportChange({ bounds, zoom });
  });
}

/** Outlast the fetch debounce. */
const settle = () => new Promise((r) => setTimeout(r, 400));

beforeEach(() => {
  vi.clearAllMocks();
  mapProps.current = null;
  mockMapFetch.mockImplementation(() => Promise.resolve({ items: [PIN], truncated: false }));
});

// ─── Tests ──────────────────────────────────────────────────────────

describe("MapPage", () => {
  it("fetches pins for the padded viewport once the pan settles", async () => {
    await renderPage();
    await moveTo(VIEW);
    expect(mockMapFetch).not.toHaveBeenCalled();

    await waitFor(() =>
      expect(mockMapFetch).toHaveBeenCalledWith({ ...PADDED, scope: "all", limit: MAP_PINS_LIMIT }),
    );
    await waitFor(() => expect(mapProps.current.pins).toEqual([PIN]));
  });

  it("collapses a burst of pans into one request", async () => {
    await renderPage();
    await moveTo(VIEW);
    await moveTo(INNER);
    await moveTo(VIEW);

    await waitFor(() => expect(mockMapFetch).toHaveBeenCalledTimes(1));
    await act(settle);
    expect(mockMapFetch).toHaveBeenCalledTimes(1);
  });

  it("skips the request when the new view is inside the last fetched area", async () => {
    await renderPage();
    await moveTo(VIEW);
    await waitFor(() => expect(mockMapFetch).toHaveBeenCalledTimes(1));

    await moveTo(INNER);
    await act(settle);

    expect(mockMapFetch).toHaveBeenCalledTimes(1);
  });

  it("refetches when the view leaves the fetched area", async () => {
    await renderPage();
    await moveTo(VIEW);
    await waitFor(() => expect(mockMapFetch).toHaveBeenCalledTimes(1));

    await moveTo(FAR);

    await waitFor(() => expect(mockMapFetch).toHaveBeenCalledTimes(2));
    expect(mockMapFetch).toHaveBeenLastCalledWith(expect.objectContaining(padBounds(FAR)));
  });

  it("refetches an inner view when the last fetch was truncated", async () => {
    mockMapFetch.mockImplementation(() => Promise.resolve({ items: [PIN], truncated: true }));
    await renderPage();
    await moveTo(VIEW);
    await waitFor(() => expect(mockMapFetch).toHaveBeenCalledTimes(1));

    await moveTo(INNER);

    await waitFor(() => expect(mockMapFetch).toHaveBeenCalledTimes(2));
  });

  it("refetches the current view right away with the new scope", async () => {
    await renderPage();
    await moveTo(VIEW);
    await waitFor(() => expect(mockMapFetch).toHaveBeenCalledTimes(1));

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "map.mySpots" }));
    });

    await waitFor(() =>
      expect(mockMapFetch).toHaveBeenLastCalledWith(expect.objectContaining({ scope: "mine" })),
    );
    expect(screen.getByRole("button", { name: "map.mySpots" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
  });

  it("opens the spot when a preview card is tapped", async () => {
    await renderPage();

    await act(async () => {
      mapProps.current.onSpotClick(PIN);
    });

    expect(mockPush).toHaveBeenCalledWith("/spot/s1");
  });

  it("drops a stale response that lands after a newer one", async () => {
    let resolveFirst!: (v: { items: MapPin[]; truncated: boolean }) => void;
    mockMapFetch
      .mockImplementationOnce(() => new Promise((r) => { resolveFirst = r; }))
      .mockImplementationOnce(() =>
        Promise.resolve({ items: [{ ...PIN, id: "new" }], truncated: false }),
      );
    await renderPage();

    await moveTo(VIEW);
    await waitFor(() => expect(mockMapFetch).toHaveBeenCalledTimes(1));
    await moveTo(FAR);
    await waitFor(() => expect(mockMapFetch).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(mapProps.current.pins.map((p: MapPin) => p.id)).toEqual(["new"]),
    );

    await act(async () => {
      resolveFirst({ items: [{ ...PIN, id: "old" }], truncated: false });
    });

    expect(mapProps.current.pins.map((p: MapPin) => p.id)).toEqual(["new"]);
  });

  it("hands the map its copy", async () => {
    await renderPage();

    expect(mapProps.current.labels.cluster(12)).toBe("map.spotsInCluster");
    expect(mapProps.current.labels.untitled).toBe("spots.untitled");
    expect(mapProps.current.labels.open).toBe("map.openSpot");
  });
});
