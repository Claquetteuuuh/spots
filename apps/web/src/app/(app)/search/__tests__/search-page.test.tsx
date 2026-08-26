/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SearchPage from "../page";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const mockSearch = vi.fn();

// Mock auth context
vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    user: { id: "u1", username: "testuser", name: "Test User" },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

// Mock api client
vi.mock("@/lib/api-client", () => ({
  apiClient: {
    users: {
      search: (...args: unknown[]) => mockSearch(...args),
    },
  },
}));

describe("SearchPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders search input", () => {
    render(<SearchPage />);
    expect(screen.getByText("Search")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Search for a photographer..."),
    ).toBeInTheDocument();
  });

  it("searches on form submit", async () => {
    mockSearch.mockResolvedValue([
      {
        id: "u2",
        username: "jane",
        name: "Jane",
        avatarUrl: null,
        _count: { spots: 5 },
      },
    ]);

    render(<SearchPage />);
    const input = screen.getByPlaceholderText("Search for a photographer...");
    fireEvent.change(input, { target: { value: "jane" } });
    fireEvent.submit(input.closest("form")!);

    await waitFor(() => {
      expect(mockSearch).toHaveBeenCalledWith("jane");
    });

    await waitFor(() => {
      expect(screen.getByText("Jane")).toBeInTheDocument();
      expect(screen.getByText("@jane")).toBeInTheDocument();
    });
  });

  it("shows empty state when no results", async () => {
    mockSearch.mockResolvedValue([]);

    render(<SearchPage />);
    const input = screen.getByPlaceholderText("Search for a photographer...");
    fireEvent.change(input, { target: { value: "nobody" } });
    fireEvent.submit(input.closest("form")!);

    await waitFor(() => {
      expect(
        screen.getByText("No photographers found"),
      ).toBeInTheDocument();
    });
  });
});
