"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { applyMention, mentionQueryAt } from "@trs/shared/mentions";
import { apiClient, type User } from "@/lib/api-client";
import { Avatar } from "@/components/avatar";

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  rows?: number;
}

/** Long enough that a name settles before we ask for it. */
const SEARCH_DELAY_MS = 200;
const MAX_SUGGESTIONS = 6;

/**
 * A caption box that knows people: type `@` and the accounts whose name
 * starts that way are offered, arrow keys and Enter to choose. What is
 * stored is the text itself — the `@name` — and the server works out who
 * was meant from it.
 */
export function MentionInput({
  value,
  onChange,
  placeholder,
  maxLength,
  disabled,
  rows = 2,
}: MentionInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [handle, setHandle] = useState<{ query: string; start: number } | null>(null);
  const [people, setPeople] = useState<User[]>([]);
  const [active, setActive] = useState(0);

  /** What is being named at the caret, if anything. */
  const readHandle = useCallback((el: HTMLTextAreaElement) => {
    const found = mentionQueryAt(el.value, el.selectionStart ?? el.value.length);
    setHandle(found && found.query.length > 0 ? found : null);
    setActive(0);
  }, []);

  // Ask for names once the typing pauses; an empty answer closes the list.
  useEffect(() => {
    if (!handle) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      void apiClient.users
        .search(handle.query)
        .then((found) => {
          if (!cancelled) setPeople(found.slice(0, MAX_SUGGESTIONS));
        })
        .catch(() => {
          if (!cancelled) setPeople([]);
        });
    }, SEARCH_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [handle]);

  const suggestions = handle ? people : [];

  const choose = (username: string) => {
    const el = inputRef.current;
    if (!el || !handle) return;
    const caret = el.selectionStart ?? el.value.length;
    const next = applyMention(value, handle.start, caret, username);
    onChange(next.text);
    setHandle(null);
    setPeople([]);
    // Put the caret after the name we just wrote
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(next.caret, next.caret);
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      choose(suggestions[active].username);
    } else if (e.key === "Escape") {
      setHandle(null);
    }
  };

  return (
    <div className="relative">
      <textarea
        ref={inputRef}
        value={value}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          readHandle(e.target);
        }}
        onKeyUp={(e) => readHandle(e.currentTarget)}
        onClick={(e) => readHandle(e.currentTarget)}
        onBlur={() => {
          // Let a click on a name land before the list goes away
          setTimeout(() => setHandle(null), 150);
        }}
        onKeyDown={onKeyDown}
        className="w-full resize-none rounded-md border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
      />

      {suggestions.length > 0 ? (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-md border border-border bg-bg shadow-float"
        >
          {suggestions.map((person, i) => (
            <li key={person.id}>
              <button
                type="button"
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(person.username)}
                className={`flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                  i === active ? "bg-bg-secondary" : "hover:bg-bg-secondary"
                }`}
              >
                <Avatar url={person.avatarUrl} name={person.name} size={24} />
                <span className="font-semibold text-text">@{person.username}</span>
                <span className="truncate text-text-tertiary">{person.name}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
