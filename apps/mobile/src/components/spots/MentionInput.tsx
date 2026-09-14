import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { applyMention, mentionQueryAt } from "@trs/shared/mentions";
import { useTheme } from "../../theme";
import { searchUsers } from "../../lib/api";
import type { User } from "../../types";
import { Avatar } from "../Avatar";
import { Input } from "../ui/Input";

interface MentionInputProps {
  value: string;
  onChangeText: (value: string) => void;
  label?: string;
  placeholder?: string;
  maxLength?: number;
  editable?: boolean;
  testID?: string;
}

/** Long enough that a name settles before we ask for it. */
const SEARCH_DELAY_MS = 250;
const MAX_SUGGESTIONS = 5;

/**
 * A caption field that knows people: type `@` and the accounts whose name
 * starts that way are offered. What is stored is the text itself — the
 * `@name` — and the server works out who was meant from it.
 */
export function MentionInput({
  value,
  onChangeText,
  label,
  placeholder,
  maxLength,
  editable = true,
  testID,
}: MentionInputProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [handle, setHandle] = useState<{ query: string; start: number } | null>(null);
  const [people, setPeople] = useState<User[]>([]);
  /** Where the caret sat when the handle was read. */
  const caretRef = useRef(0);

  useEffect(() => {
    if (!handle) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      searchUsers(handle.query, MAX_SUGGESTIONS)
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

  /** A phone has no caret to read while typing: the end of the text is it. */
  const onChange = (next: string) => {
    onChangeText(next);
    caretRef.current = next.length;
    const found = mentionQueryAt(next, next.length);
    setHandle(found && found.query.length > 0 ? found : null);
  };

  const choose = (username: string) => {
    if (!handle) return;
    const next = applyMention(value, handle.start, caretRef.current, username);
    onChangeText(next.text);
    caretRef.current = next.caret;
    setHandle(null);
    setPeople([]);
  };

  return (
    <View>
      <Input
        label={label}
        placeholder={placeholder ?? t("spotPhotos.captionPlaceholder")}
        value={value}
        onChangeText={onChange}
        maxLength={maxLength}
        editable={editable}
        multiline
        testID={testID}
      />

      {suggestions.length > 0 ? (
        <View
          style={[
            styles.list,
            {
              backgroundColor: theme.colors.bg,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md,
            },
          ]}
          testID="mention-suggestions"
        >
          {suggestions.map((person) => (
            <Pressable
              key={person.id}
              onPress={() => choose(person.username)}
              style={[styles.row, { padding: theme.spacing.sm }]}
              accessibilityRole="button"
              testID={`mention-${person.username}`}
            >
              <Avatar url={person.avatarUrl} name={person.name} size={24} />
              <Text
                style={{
                  color: theme.colors.text,
                  fontSize: theme.typography.size.sm,
                  fontWeight: theme.typography.weight.semibold,
                }}
              >
                @{person.username}
              </Text>
              <Text
                numberOfLines={1}
                style={{ color: theme.colors.textTertiary, fontSize: theme.typography.size.sm, flex: 1 }}
              >
                {person.name}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    marginTop: 6,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
