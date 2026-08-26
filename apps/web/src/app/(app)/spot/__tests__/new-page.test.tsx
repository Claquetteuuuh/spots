/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AddSpotPage from "../new/page";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock next/dynamic to render children directly
vi.mock("next/dynamic", () => ({
  default: () => {
    const MockMap = () => <div data-testid="location-picker">Map</div>;
    MockMap.displayName = "MockMap";
    return MockMap;
  },
}));

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
    upload: { photo: vi.fn() },
    spots: { create: vi.fn() },
  },
  getToken: () => "test-token",
}));

describe("AddSpotPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the photo upload step initially", () => {
    render(<AddSpotPage />);
    expect(screen.getByText("Add a spot")).toBeInTheDocument();
    expect(screen.getByText("Pick from gallery")).toBeInTheDocument();
  });

  it("shows next button disabled when no photo selected", () => {
    render(<AddSpotPage />);
    const nextBtn = screen.getByText("Next");
    expect(nextBtn).toBeDisabled();
  });

  it("shows step indicators", () => {
    render(<AddSpotPage />);
    expect(screen.getByText("Take a photo")).toBeInTheDocument();
    expect(screen.getByText("Map")).toBeInTheDocument();
    expect(screen.getByText("Spot details")).toBeInTheDocument();
  });

  it("shows cancel button on first step", () => {
    render(<AddSpotPage />);
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });
});
