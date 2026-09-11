/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
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

vi.mock("@/components/composition-icon", () => ({
  CompositionIcon: ({ type }: { type: string }) => <span data-testid={`comp-icon-${type}`} />,
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

const pin = (id: string, colors: string[] = ["#C44536"]): MapPin => ({
  id,
  latitude: 48.85,
  longitude: 2.35,
  title: `Spot ${id}`,
  photoUrl: `https://cdn.example.com/${id}.jpg`,
  city: "Paris",
  userId: "owner-1",
  isOwn: true,
  colors,
  compositions: ["SYMMETRY"],
  accessibility: "EASY",
});
const PIN = pin("s1");

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

async function click(el: Element) {
  await act(async () => {
    fireEvent.click(el);
  });
}

const openFilters = () => click(screen.getByText("map.filters"));

/** Outlast the fetch debounce. */
const settle = () => new Promise((r) => setTimeout(r, 400));

const ids = () => mapProps.current.pins.map((p: MapPin) => p.id);

function stubGeolocation(coords: { latitude: number; longitude: number } | null) {
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: coords
      ? { getCurrentPosition: (ok: (p: { coords: typeof coords }) => void) => ok({ coords }) }
      : undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mapProps.current = null;
  mockMapFetch.mockImplementation(() => Promise.resolve({ items: [PIN], truncated: false }));
});

afterEach(() => stubGeolocation(null));

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

    await click(screen.getByRole("button", { name: "map.mySpots" }));

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
      .mockImplementationOnce(() => Promise.resolve({ items: [pin("new")], truncated: false }));
    await renderPage();

    await moveTo(VIEW);
    await waitFor(() => expect(mockMapFetch).toHaveBeenCalledTimes(1));
    await moveTo(FAR);
    await waitFor(() => expect(mockMapFetch).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(ids()).toEqual(["new"]));

    await act(async () => {
      resolveFirst({ items: [pin("old")], truncated: false });
    });

    expect(ids()).toEqual(["new"]);
  });

  it("hands the map its copy", async () => {
    await renderPage();

    expect(mapProps.current.labels.cluster(12)).toBe("map.spotsInCluster");
    expect(mapProps.current.labels.untitled).toBe("spots.untitled");
    expect(mapProps.current.labels.open).toBe("map.openSpot");
  });
});

describe("MapPage — filters", () => {
  it("filters by colour family on the client, and resets", async () => {
    mockMapFetch.mockImplementation(() =>
      Promise.resolve({ items: [pin("red", ["#C44536"]), pin("sea", ["#2C5F7C"])], truncated: false }),
    );
    await renderPage();
    await moveTo(VIEW);
    await waitFor(() => expect(ids()).toEqual(["red", "sea"]));

    await openFilters();
    await click(screen.getByLabelText("colorFamilies.blue"));

    await waitFor(() => expect(ids()).toEqual(["sea"]));
    await act(settle);
    expect(mockMapFetch).toHaveBeenCalledTimes(1);
    expect(screen.getByText("1")).toBeTruthy(); // the badge

    await click(screen.getByText("map.filtersReset"));
    await waitFor(() => expect(ids()).toEqual(["red", "sea"]));
  });

  it("sends composition and accessibility filters to the server right away", async () => {
    await renderPage();
    await moveTo(VIEW);
    await waitFor(() => expect(mockMapFetch).toHaveBeenCalledTimes(1));

    await openFilters();
    await click(screen.getByText("compositions.SYMMETRY"));
    await click(screen.getByText("spots.accessibilityLevel.EASY"));

    await waitFor(() =>
      expect(mockMapFetch).toHaveBeenLastCalledWith(
        expect.objectContaining({ compositions: "SYMMETRY", accessibility: "EASY" }),
      ),
    );
  });

  it("fetches around the photographer when a radius is picked", async () => {
    stubGeolocation({ latitude: 48.85, longitude: 2.35 });
    await renderPage();
    await moveTo(VIEW);
    await waitFor(() => expect(mockMapFetch).toHaveBeenCalledTimes(1));

    await openFilters();
    await click(screen.getAllByText("map.withinKm")[1]); // 5 km

    await waitFor(() =>
      expect(mockMapFetch).toHaveBeenLastCalledWith(
        expect.objectContaining({ nearLat: 48.85, nearLng: 2.35, radiusKm: 5 }),
      ),
    );
    expect(screen.queryByText("map.needLocation")).toBeNull();
  });

  it("asks for a position when a radius is picked without one", async () => {
    await renderPage();
    await moveTo(VIEW);
    await waitFor(() => expect(mockMapFetch).toHaveBeenCalledTimes(1));

    await openFilters();
    await click(screen.getAllByText("map.withinKm")[0]);

    expect(screen.getByText("map.needLocation")).toBeTruthy();
    await act(settle);
    expect(mockMapFetch).toHaveBeenLastCalledWith(
      expect.not.objectContaining({ nearLat: expect.anything() }),
    );
  });

  it("says so when nothing matches the filters here", async () => {
    await renderPage();
    await moveTo(VIEW);
    await waitFor(() => expect(ids()).toEqual(["s1"]));

    await openFilters();
    await click(screen.getByLabelText("colorFamilies.green"));

    await waitFor(() => expect(screen.getByText("map.noSpotsMatch")).toBeTruthy());
  });
});
