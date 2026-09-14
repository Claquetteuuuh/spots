// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React, { useState } from "react";

const mockSearch = vi.fn();
vi.mock("@/lib/api-client", () => ({
  apiClient: { users: { search: (...args: unknown[]) => mockSearch(...args) } },
}));

import { MentionInput } from "../mention-input";

const ALICE = { id: "u1", username: "alice", name: "Alice Dupont", avatarUrl: null };

function Field({ onChange }: { onChange?: (v: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <MentionInput
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
      placeholder="caption"
    />
  );
}

/** Render the field and wait for it to be on screen. */
async function mount(onChange?: (v: string) => void) {
  await act(async () => {
    render(<Field onChange={onChange} />);
  });
  return screen.findByPlaceholderText("caption");
}

/** Type into the box and put the caret at the end, as a person would. */
async function type(text: string) {
  const box = screen.getByPlaceholderText("caption") as HTMLTextAreaElement;
  await act(async () => {
    fireEvent.change(box, { target: { value: text, selectionStart: text.length } });
  });
  return box;
}

describe("MentionInput", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearch.mockResolvedValue([ALICE]);
  });

  it("offers accounts once a name is being typed after an @", async () => {
    await mount();

    await type("shot with @al");

    expect(await screen.findByText("@alice")).toBeTruthy();
    expect(mockSearch).toHaveBeenCalledWith("al");
  });

  it("writes the chosen name in place of what was typed", async () => {
    const onChange = vi.fn();
    await mount(onChange);
    await type("shot with @al");

    await act(async () => {
      fireEvent.click(await screen.findByText("@alice"));
    });

    expect(onChange).toHaveBeenLastCalledWith("shot with @alice ");
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("takes the name under the arrow keys when Enter is pressed", async () => {
    const onChange = vi.fn();
    await mount(onChange);
    const box = await type("@al");
    await screen.findByText("@alice");

    await act(async () => {
      fireEvent.keyDown(box, { key: "ArrowDown" });
      fireEvent.keyDown(box, { key: "Enter" });
    });

    expect(onChange).toHaveBeenLastCalledWith("@alice ");
  });

  it("asks for nobody when no one is being named", async () => {
    await mount();

    await type("just a caption");

    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
    expect(mockSearch).not.toHaveBeenCalled();
  });
});
