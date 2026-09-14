// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import type { SpotPhoto } from "@/lib/api-client";

vi.mock("@/lib/use-t", () => ({ useT: () => (key: string) => key }));

// Next's Link wants a router; a plain anchor says as much about the markup.
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: React.PropsWithChildren<{ href?: string } & Record<string, unknown>>) =>
    React.createElement("a", { href, ...props }, children),
}));

import { CommunityPost } from "../community-post";

const POST: SpotPhoto = {
  id: "p1",
  spotId: "s1",
  userId: "u1",
  caption: null,
  createdAt: "2026-09-14T10:00:00.000Z",
  images: [{ id: "i1", photoUrl: "https://cdn/1.webp" }],
  mentions: [],
  user: { id: "u1", username: "bob", name: "Bob", avatarUrl: null },
};

const post = (over: Partial<SpotPhoto> = {}): SpotPhoto => ({ ...POST, ...over });

async function show(p: SpotPhoto, props: Partial<React.ComponentProps<typeof CommunityPost>> = {}) {
  const onOpenPhoto = vi.fn();
  const onDelete = vi.fn();
  await act(async () => {
    render(
      <CommunityPost
        post={p}
        canDelete={false}
        isDeleting={false}
        onDelete={onDelete}
        onOpenPhoto={onOpenPhoto}
        {...props}
      />,
    );
  });
  return { onOpenPhoto, onDelete };
}

describe("CommunityPost", () => {
  it("reads top to bottom: the author, then the text, then the photos", async () => {
    const { container } = { container: document.body };
    await show(post({ caption: "Golden hour" }));

    const order = Array.from(container.querySelectorAll("a, p, img")).map((el) => el.tagName);
    // The author's link comes before the caption, and the caption before the photo
    expect(screen.getByText("bob")).toBeTruthy();
    expect(order.indexOf("P")).toBeLessThan(order.indexOf("IMG"));
    expect(screen.getByText("Golden hour")).toBeTruthy();
  });

  it("links the people the caption names to their profile", async () => {
    await show(
      post({
        caption: "shot with @alice and @ghost",
        mentions: [{ id: "u2", username: "alice" }],
      }),
    );

    const link = screen.getByText("@alice").closest("a");
    expect(link?.getAttribute("href")).toBe("/profile/alice");
    // A name nobody answers to stays plain text
    expect(screen.getByText(/and @ghost/)).toBeTruthy();
  });

  it("fans out every photo and opens the one clicked", async () => {
    const { onOpenPhoto } = await show(
      post({
        images: [
          { id: "i1", photoUrl: "https://cdn/1.webp" },
          { id: "i2", photoUrl: "https://cdn/2.webp" },
          { id: "i3", photoUrl: "https://cdn/3.webp" },
        ],
      }),
    );

    const cards = screen.getAllByRole("button").filter((b) => b.querySelector("img"));
    expect(cards).toHaveLength(3);

    // They are stacked back to front, so the first photo sits on top
    await act(async () => {
      fireEvent.click(cards[cards.length - 1]);
    });
    expect(onOpenPhoto).toHaveBeenCalledWith(0);
  });

  it("counts the photos the fan cannot show", async () => {
    await show(
      post({
        images: Array.from({ length: 6 }, (_, i) => ({ id: `i${i}`, photoUrl: `https://cdn/${i}.webp` })),
      }),
    );

    expect(screen.getByText("+2")).toBeTruthy();
  });

  it("offers the bin only to those who may use it", async () => {
    const { onDelete } = await show(post(), { canDelete: true });

    await act(async () => {
      fireEvent.click(screen.getByLabelText("spotPhotos.deletePhoto"));
    });
    expect(onDelete).toHaveBeenCalled();

    document.body.innerHTML = "";
    await show(post());
    expect(screen.queryByLabelText("spotPhotos.deletePhoto")).toBeNull();
  });
});
