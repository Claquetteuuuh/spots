import { confirmDialog, noticeDialog, useDialogStore } from "../dialog-store";

beforeEach(() => {
  useDialogStore.setState({ queue: [] });
});

describe("dialog store", () => {
  it("queues a question and resolves with the answer", async () => {
    const answer = confirmDialog({ title: "Delete?", destructive: true });
    const [entry] = useDialogStore.getState().queue;
    expect(entry).toMatchObject({ title: "Delete?", kind: "confirm", destructive: true });

    useDialogStore.getState().settle(entry.id, true);
    await expect(answer).resolves.toBe(true);
    expect(useDialogStore.getState().queue).toHaveLength(0);
  });

  it("resolves false when cancelled", async () => {
    const answer = confirmDialog({ title: "Leave?" });
    useDialogStore.getState().settle(useDialogStore.getState().queue[0].id, false);
    await expect(answer).resolves.toBe(false);
  });

  it("keeps later questions waiting behind the first", async () => {
    const first = confirmDialog({ title: "First" });
    const second = confirmDialog({ title: "Second" });
    expect(useDialogStore.getState().queue.map((e) => e.title)).toEqual(["First", "Second"]);

    useDialogStore.getState().settle(useDialogStore.getState().queue[0].id, true);
    await expect(first).resolves.toBe(true);
    expect(useDialogStore.getState().queue.map((e) => e.title)).toEqual(["Second"]);

    useDialogStore.getState().settle(useDialogStore.getState().queue[0].id, false);
    await expect(second).resolves.toBe(false);
  });

  it("shows a notice and resolves once closed", async () => {
    const done = noticeDialog({ title: "Saved", message: "All good" });
    const [entry] = useDialogStore.getState().queue;
    expect(entry).toMatchObject({ title: "Saved", message: "All good", kind: "notice" });
    useDialogStore.getState().settle(entry.id, true);
    await expect(done).resolves.toBeUndefined();
  });

  it("ignores settling an id that is not there", () => {
    void confirmDialog({ title: "A" });
    useDialogStore.getState().settle(999_999, true);
    expect(useDialogStore.getState().queue).toHaveLength(1);
  });
});
