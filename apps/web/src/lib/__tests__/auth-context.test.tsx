/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "../auth-context";

// Mock api-client
const mockMe = vi.fn();
const mockLogin = vi.fn();
const mockLogout = vi.fn();
const mockRegister = vi.fn();
const mockLoginWithGoogle = vi.fn();
let mockGetTokenReturn: string | null = null;

vi.mock("../api-client", () => ({
  getToken: () => mockGetTokenReturn,
  getRefreshToken: () => null,
  apiClient: {
    auth: {
      me: (...args: unknown[]) => mockMe(...args),
      login: (...args: unknown[]) => mockLogin(...args),
      register: (...args: unknown[]) => mockRegister(...args),
      loginWithGoogle: (...args: unknown[]) => mockLoginWithGoogle(...args),
      logout: (...args: unknown[]) => mockLogout(...args),
    },
  },
}));

const MOCK_USER = {
  id: "user-1",
  email: "alice@example.com",
  username: "alice",
  name: "Alice",
  avatarUrl: null,
  bio: null,
  locale: "en",
  provider: "EMAIL",
  createdAt: "2024-01-01T00:00:00.000Z",
};

function TestConsumer() {
  const { user, isAuthenticated, isLoading, login, logout, refreshUser } =
    useAuth();

  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="username">{user?.username ?? "none"}</span>
      <button data-testid="login-btn" onClick={() => login("a@b.com", "pw")} />
      <button data-testid="logout-btn" onClick={logout} />
      <button data-testid="refresh-btn" onClick={refreshUser} />
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTokenReturn = null;
  });

  it("renders children", async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <span>child</span>
        </AuthProvider>,
      );
    });
    expect(screen.getByText("child")).toBeInTheDocument();
  });

  it("starts unauthenticated when no token exists", async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });

    expect(screen.getByTestId("authenticated").textContent).toBe("false");
    expect(screen.getByTestId("username").textContent).toBe("none");
  });

  it("restores session from existing token", async () => {
    mockGetTokenReturn = "valid-token";
    mockMe.mockResolvedValue(MOCK_USER);

    await act(async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });

    expect(screen.getByTestId("authenticated").textContent).toBe("true");
    expect(screen.getByTestId("username").textContent).toBe("alice");
  });

  it("sets user after login", async () => {
    mockLogin.mockResolvedValue({ user: MOCK_USER, accessToken: "tok", refreshToken: "rtok" });

    await act(async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });

    await act(async () => {
      screen.getByTestId("login-btn").click();
    });

    expect(screen.getByTestId("authenticated").textContent).toBe("true");
    expect(screen.getByTestId("username").textContent).toBe("alice");
  });

  it("clears user on logout", async () => {
    mockGetTokenReturn = "valid-token";
    mockMe.mockResolvedValue(MOCK_USER);

    await act(async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("authenticated").textContent).toBe("true");
    });

    await act(async () => {
      screen.getByTestId("logout-btn").click();
    });

    expect(screen.getByTestId("authenticated").textContent).toBe("false");
    expect(screen.getByTestId("username").textContent).toBe("none");
    expect(mockLogout).toHaveBeenCalledOnce();
  });

  it("refreshUser updates the user state", async () => {
    mockGetTokenReturn = "valid-token";
    mockMe
      .mockResolvedValueOnce(MOCK_USER) // initial load
      .mockResolvedValueOnce({ ...MOCK_USER, name: "Alice Updated" }); // after refresh

    await act(async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("authenticated").textContent).toBe("true");
    });

    await act(async () => {
      screen.getByTestId("refresh-btn").click();
    });

    expect(mockMe).toHaveBeenCalledTimes(2);
  });
});

describe("useAuth", () => {
  it("logs error when used outside AuthProvider", async () => {
    // React 19 catches render errors internally and logs them via console.error
    // rather than propagating a synchronous throw from render().
    // The error also leaks as an uncaught exception — catch it to prevent
    // vitest from treating it as a test failure.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const handler = (e: ErrorEvent) => {
      if (e.error?.message?.includes("useAuth must be used within an AuthProvider")) {
        e.preventDefault();
      }
    };

    // Node-style listener for vitest's uncaught handler
    const nodeHandler = (err: Error) => {
      if (err?.message?.includes("useAuth must be used within an AuthProvider")) {
        // swallow — we're testing that this error fires
        return;
      }
      throw err;
    };
    process.on("uncaughtException", nodeHandler);

    await act(async () => {
      render(<TestConsumer />);
    });

    process.removeListener("uncaughtException", nodeHandler);

    const errorMessages = spy.mock.calls.map((call) => String(call[0]));
    expect(
      errorMessages.some((msg) =>
        msg.includes("useAuth must be used within an AuthProvider"),
      ),
    ).toBe(true);

    spy.mockRestore();
  });
});
