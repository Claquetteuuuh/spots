"use client";

import { useEffect, useId, useRef, useSyncExternalStore } from "react";
import { useT } from "@/lib/use-t";

export interface DialogOptions {
  title: string;
  message?: string;
  /** The button that says yes. Defaults to OK. */
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red button: deleting, logging out — things that cost something. */
  destructive?: boolean;
}

interface DialogEntry extends DialogOptions {
  id: number;
  kind: "confirm" | "notice";
  resolve: (ok: boolean) => void;
}

// One queue for the whole app: dialogs asked from anywhere show one at a
// time, in order, through the single host mounted in the root layout.
let queue: DialogEntry[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const NONE: DialogEntry[] = [];

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function push(kind: DialogEntry["kind"], options: DialogOptions): Promise<boolean> {
  return new Promise((resolve) => {
    queue = [...queue, { ...options, id: nextId++, kind, resolve }];
    emit();
  });
}

function settle(entry: DialogEntry, ok: boolean) {
  queue = queue.filter((e) => e !== entry);
  emit();
  entry.resolve(ok);
}

/** Ask a yes/no question. Resolves true when the user says yes. */
export function confirmDialog(options: DialogOptions): Promise<boolean> {
  return push("confirm", options);
}

/** Tell the user something; resolves once they close it. */
export async function noticeDialog(options: DialogOptions): Promise<void> {
  await push("notice", options);
}

/**
 * Renders whatever dialog is asked for, in the app's own style rather than
 * the browser's. Mount once, near the root.
 */
export function DialogHost() {
  const entries = useSyncExternalStore(subscribe, () => queue, () => NONE);
  const current = entries[0];
  return current ? <Dialog key={current.id} entry={current} /> : null;
}

function Dialog({ entry }: { entry: DialogEntry }) {
  const t = useT();
  const titleId = useId();
  const messageId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  const isConfirm = entry.kind === "confirm";
  const cancel = () => settle(entry, false);
  const ok = () => settle(entry, true);

  useEffect(() => {
    // Enter must not delete by accident: a destructive question starts on Cancel
    (entry.destructive && isConfirm ? cancelRef : confirmRef).current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") settle(entry, false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [entry, isConfirm]);

  return (
    <div
      className="fixed inset-0 z-[1200] flex items-end justify-center bg-text/30 p-4 sm:items-center"
      onClick={cancel}
      data-testid="dialog-backdrop"
    >
      <div
        role={isConfirm ? "alertdialog" : "dialog"}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={entry.message ? messageId : undefined}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-[24px] bg-bg p-6 shadow-float"
        data-testid="dialog"
      >
        <h2 id={titleId} className="text-lg font-bold text-text">
          {entry.title}
        </h2>
        {entry.message ? (
          <p id={messageId} className="mt-2 text-[15px] leading-relaxed text-text-secondary">
            {entry.message}
          </p>
        ) : null}

        <div className="mt-6 flex gap-2">
          {isConfirm ? (
            <button
              ref={cancelRef}
              type="button"
              onClick={cancel}
              className="flex-1 cursor-pointer rounded-full border border-border px-4 py-2.5 text-[15px] font-medium text-text transition-colors hover:bg-bg-secondary"
              data-testid="dialog-cancel"
            >
              {entry.cancelLabel ?? t("common.cancel")}
            </button>
          ) : null}
          <button
            ref={confirmRef}
            type="button"
            onClick={ok}
            className={`flex-1 cursor-pointer rounded-full px-4 py-2.5 text-[15px] font-semibold text-on-accent transition-colors ${
              entry.destructive ? "bg-error hover:bg-error/90" : "bg-accent hover:bg-accent-dark"
            }`}
            data-testid="dialog-confirm"
          >
            {entry.confirmLabel ?? t("common.ok")}
          </button>
        </div>
      </div>
    </div>
  );
}
