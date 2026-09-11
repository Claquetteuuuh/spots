/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// ─── Mocks ──────────────────────────────────────────────────────────

const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockBack = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack }),
}));

vi.mock("@/lib/use-t", () => ({
  useT: () => (key: string) => key,
}));

const mockUser = { id: "owner-1", email: "a@b.c", username: "alice", name: "Alice" };
vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ user: mockUser }),
}));

const mockGet = vi.fn();
const mockUpdate = vi.fn();

vi.mock("@/lib/api-client", () => ({
  apiClient: {
    spots: {
      get: (...args: unknown[]) => mockGet(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}));

vi.mock("@/components/composition-icon", () => ({
  CompositionIcon: ({ type }: { type: string }) => <span data-testid={`comp-icon-${type}`} />,
}));

vi.mock("@/components/page", () => ({
  PAGE_WIDE: "max-w-2xl mx-auto px-4",
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

vi.mock("@/components/ui/limit-hint", () => ({
  CharacterCount: () => null,
  SelectionCount: () => null,
}));

vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

// ─── Fixtures ───────────────────────────────────────────────────────

const SPOT = {
  id: "s1",
  userId: "owner-1",
  latitude: 48.85,
  longitude: 2.35,
  photoUrl: "https://cdn.example.com/photo.jpg",
  photoKey: "key-1",
  title: "Golden hour bridge",
  description: "A lovely sunset spot",
  isFree: true,
  visibility: "FOLLOWERS" as const,
  colors: ["#C44536"],
  compositions: ["SYMMETRY"],
  customComposition: null,
  tags: ["sunset"],
  address: null,
  city: "Paris",
  country: "France",
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
};

// ─── Helpers ────────────────────────────────────────────────────────

import EditSpotPage from "../page";

async function renderPage() {
  const params = Promise.resolve({ id: "s1" });
  let result!: ReturnType<typeof render>;
  await act(async () => {
    result = render(<EditSpotPage params={params} />);
  });
  return result;
}

// ─── Tests ──────────────────────────────────────────────────────────

describe("EditSpotPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockImplementation(() => Promise.resolve(SPOT));
    mockUpdate.mockImplementation(() => Promise.resolve(SPOT));
  });

  it("shows skeleton while loading", async () => {
    let resolve!: (v: typeof SPOT) => void;
    mockGet.mockImplementation(() => new Promise((r) => { resolve = r; }));

    await renderPage();

    expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);

    await act(async () => resolve(SPOT));
  });

  it("pre-fills the form with existing spot data", async () => {
    await renderPage();

    await waitFor(() => {
      expect(screen.getByDisplayValue("Golden hour bridge")).toBeTruthy();
    });

    expect(screen.getByDisplayValue("A lovely sunset spot")).toBeTruthy();
  });

  it("calls apiClient.spots.update on save", async () => {
    mockUpdate.mockImplementation(() => Promise.resolve(SPOT));

    await renderPage();

    await waitFor(() => {
      expect(screen.getByDisplayValue("Golden hour bridge")).toBeTruthy();
    });

    // Click save (sends current pre-filled values)
    const saveButton = screen.getByText("common.save");
    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith("s1", expect.objectContaining({
        title: "Golden hour bridge",
        description: "A lovely sunset spot",
        compositions: ["SYMMETRY"],
        colors: ["#C44536"],
      }));
    });
  });

  it("shows success message after saving", async () => {
    mockUpdate.mockImplementation(() => Promise.resolve(SPOT));

    await renderPage();

    await waitFor(() => {
      expect(screen.getByDisplayValue("Golden hour bridge")).toBeTruthy();
    });

    const saveButton = screen.getByText("common.save");
    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(screen.getByText("spots.editSuccess")).toBeTruthy();
    });
  });

  it("shows error message when update fails", async () => {
    mockUpdate.mockImplementation(() => Promise.reject(new Error("Forbidden")));

    await renderPage();

    await waitFor(() => {
      expect(screen.getByDisplayValue("Golden hour bridge")).toBeTruthy();
    });

    const saveButton = screen.getByText("common.save");
    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(screen.getByText("Forbidden")).toBeTruthy();
    });
  });

  it("redirects non-owners away", async () => {
    const otherSpot = { ...SPOT, userId: "other-user" };
    mockGet.mockImplementation(() => Promise.resolve(otherSpot));

    await renderPage();

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/spot/s1");
    });
  });

  it("renders composition grid with correct initial selection", async () => {
    await renderPage();

    await waitFor(() => {
      expect(screen.getByDisplayValue("Golden hour bridge")).toBeTruthy();
    });

    // SYMMETRY should already be selected (from spot data)
    const symmetryButton = screen.getByText("compositions.SYMMETRY").closest("button")!;
    expect(symmetryButton.getAttribute("aria-pressed")).toBe("true");

    // DIAGONAL should not be selected
    const diagonalButton = screen.getByText("compositions.DIAGONAL").closest("button")!;
    expect(diagonalButton.getAttribute("aria-pressed")).toBe("false");
  });
});

