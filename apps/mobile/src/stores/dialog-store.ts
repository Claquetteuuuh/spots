import { create } from "zustand";

export interface DialogOptions {
  title: string;
  message?: string;
  /** The button that says yes. Defaults to OK. */
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red button: deleting, logging out — things that cost something. */
  destructive?: boolean;
}

export interface DialogEntry extends DialogOptions {
  id: number;
  kind: "confirm" | "notice";
  resolve: (ok: boolean) => void;
}

interface DialogState {
  /** Dialogs waiting their turn; the host shows the first. */
  queue: DialogEntry[];
  push: (kind: DialogEntry["kind"], options: DialogOptions) => Promise<boolean>;
  settle: (id: number, ok: boolean) => void;
}

let nextId = 1;

export const useDialogStore = create<DialogState>((set, get) => ({
  queue: [],

  push: (kind, options) =>
    new Promise((resolve) => {
      set((s) => ({ queue: [...s.queue, { ...options, id: nextId++, kind, resolve }] }));
    }),

  settle: (id, ok) => {
    const entry = get().queue.find((e) => e.id === id);
    if (!entry) return;
    set((s) => ({ queue: s.queue.filter((e) => e.id !== id) }));
    entry.resolve(ok);
  },
}));

/** Ask a yes/no question. Resolves true when the user says yes. */
export function confirmDialog(options: DialogOptions): Promise<boolean> {
  return useDialogStore.getState().push("confirm", options);
}

/** Tell the user something; resolves once they close it. */
export async function noticeDialog(options: DialogOptions): Promise<void> {
  await useDialogStore.getState().push("notice", options);
}
