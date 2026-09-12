/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  RECENT_USERS_MAX,
  clearRecentUsers,
  forgetUser,
  rememberUser,
  useRecentUsers,
} from "../recent-users";

const u = (id: string) => ({ id, username: id, name: id.toUpperCase(), avatarUrl: null });

function Probe() {
  const { recent } = useRecentUsers();
  return <p>{recent.map((r) => r.id).join(",") || "none"}</p>;
}

describe("recent users", () => {
  beforeEach(() => {
    clearRecentUsers();
  });

  it("keeps the most recent first, without duplicates, capped, and every subscriber follows", async () => {
    await act(async () => {
      render(<Probe />);
    });
    expect(screen.getByText("none")).toBeTruthy();

    await act(async () => {
      rememberUser(u("a"));
      rememberUser(u("b"));
      rememberUser(u("a"));
    });
    expect(screen.getByText("a,b")).toBeTruthy();

    await act(async () => forgetUser("b"));
    expect(screen.getByText("a")).toBeTruthy();

    await act(async () => {
      for (let i = 0; i < RECENT_USERS_MAX + 2; i++) rememberUser(u(`n${i}`));
    });
    expect(screen.getByText(/,/).textContent?.split(",")).toHaveLength(RECENT_USERS_MAX);

    await act(async () => clearRecentUsers());
    expect(screen.getByText("none")).toBeTruthy();
  });
});
