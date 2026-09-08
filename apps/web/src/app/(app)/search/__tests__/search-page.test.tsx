/** @vitest-environment jsdom */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import SearchPage from "../page";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, ...props }: { children: React.ReactNode; href: string; [k: string]: unknown }) => (
    <a {...props}>{children}</a>
  ),
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

// Mock locale context
vi.mock("@/lib/locale-context", () => ({
  useLocale: () => ({ locale: "en", setLocale: vi.fn() }),
  LocaleProvider: ({ children }: { children: React.ReactNode }) => children,
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

  it("renders search input", async () => {
    await act(async () => {
      render(<SearchPage />);
    });
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

    await act(async () => {
      render(<SearchPage />);
    });
    const input = screen.getByPlaceholderText("Search for a photographer...");
    fireEvent.change(input, { target: { value: "jane" } });

    await act(async () => {
      fireEvent.submit(input.closest("form")!);
    });

    await waitFor(() => {
      expect(mockSearch).toHaveBeenCalledWith("jane");
    });

    await waitFor(() => {
      expect(screen.getByText("jane")).toBeInTheDocument();
      expect(screen.getByText("Jane")).toBeInTheDocument();
    });
  });

  it("shows empty state when no results", async () => {
    mockSearch.mockResolvedValue([]);

    await act(async () => {
      render(<SearchPage />);
    });
    const input = screen.getByPlaceholderText("Search for a photographer...");

    await act(async () => {
      fireEvent.change(input, { target: { value: "nobody" } });
      fireEvent.submit(input.closest("form")!);
    });

    await waitFor(() => {
      expect(
        screen.getByText("No photographers found"),
      ).toBeInTheDocument();
    });
  });
});
