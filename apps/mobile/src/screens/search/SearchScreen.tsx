import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme";
import { searchUsers, followUser, unfollowUser, getUserSuggestions } from "../../lib/api";
import { useRecentUsersStore, type RecentUser } from "../../stores/recent-users-store";
import { Avatar } from "../../components/Avatar";
import { Button } from "../../components/ui/Button";
import type { RootStackNavigationProp } from "../../navigation/types";
import type { SuggestedUser, User } from "../../types";

const SEARCH_DEBOUNCE_MS = 350;

type RowKind = "result" | "recent" | "suggestion";
type Section = { key: RowKind; title: string | null; data: (User | SuggestedUser | RecentUser)[] };

export function SearchScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation<RootStackNavigationProp>();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // With nothing typed: who was looked up here lately, and who might be worth knowing
  const recent = useRecentUsersStore((s) => s.recent);
  const remember = useRecentUsersStore((s) => s.remember);
  const forget = useRecentUsersStore((s) => s.forget);
  const clearRecent = useRecentUsersStore((s) => s.clear);
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);

  useEffect(() => {
    let cancelled = false;
    getUserSuggestions()
      .then((list) => {
        if (!cancelled) setSuggestions(list);
      })
      .catch(() => {
        // No suggestions is not an error worth a message
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const runSearch = useCallback(async (value: string) => {
    if (value.trim().length === 0) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const users = await searchUsers(value.trim());
      setResults(users);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void runSearch(query);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  const patchFollowState = (id: string, status: User["followStatus"], isFollowing: boolean) => {
    const patch = <T extends User>(u: T): T => (u.id === id ? { ...u, followStatus: status, isFollowing } : u);
    setResults((prev) => prev.map(patch));
    setSuggestions((prev) => prev.map(patch));
  };

  const toggleFollow = async (user: User) => {
    setPendingIds((prev) => new Set(prev).add(user.id));
    const prevStatus = user.followStatus ?? (user.isFollowing ? "ACCEPTED" : null);
    // Optimistic update
    patchFollowState(user.id, prevStatus ? null : "PENDING", false);
    try {
      if (prevStatus) {
        await unfollowUser(user.username);
      } else {
        await followUser(user.username);
      }
    } catch {
      patchFollowState(user.id, prevStatus, prevStatus === "ACCEPTED");
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(user.id);
        return next;
      });
    }
  };

  const getFollowLabel = (user: User): string => {
    const status = user.followStatus ?? (user.isFollowing ? "ACCEPTED" : null);
    if (status === "ACCEPTED") return t("users.unfollow");
    if (status === "PENDING") return t("notifications.requested");
    return t("users.follow");
  };

  const getFollowVariant = (user: User): "primary" | "secondary" => {
    const status = user.followStatus ?? (user.isFollowing ? "ACCEPTED" : null);
    return status ? "secondary" : "primary";
  };

  /** "Followed by alice and 3 more" — why someone is suggested. */
  const suggestionReason = (user: SuggestedUser): string | null => {
    if (user.mutualUsernames.length === 0) return null;
    const names = user.mutualUsernames.join(", ");
    const more = user.mutualCount - user.mutualUsernames.length;
    return more > 0
      ? t("users.followedByMore", { names, count: more })
      : t("users.followedBy", { names });
  };

  const openProfile = (user: RecentUser) => {
    void remember(user);
    navigation.navigate("OtherProfile", { username: user.username });
  };

  const typing = query.trim().length > 0;
  const sections: Section[] = typing
    ? [{ key: "result", title: null, data: results }]
    : [
        ...(recent.length > 0 ? [{ key: "recent" as const, title: t("users.recent"), data: recent }] : []),
        ...(suggestions.length > 0
          ? [{ key: "suggestion" as const, title: t("users.suggestions"), data: suggestions }]
          : []),
      ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.bg }]} edges={["top"]}>
      <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg, paddingBottom: theme.spacing.md }}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t("users.searchPlaceholder")}
          placeholderTextColor={theme.colors.textTertiary}
          autoCapitalize="none"
          returnKeyType="search"
          onSubmitEditing={Keyboard.dismiss}
          style={[
            styles.searchInput,
            {
              color: theme.colors.text,
              backgroundColor: theme.colors.bgSecondary,
              borderRadius: theme.radius.full,
              paddingHorizontal: theme.spacing.xl,
              paddingVertical: theme.spacing.md,
              fontSize: theme.typography.size.base,
            },
          ]}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: theme.spacing.xl }} color={theme.colors.textSecondary} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{ paddingHorizontal: theme.spacing.lg }}
          renderSectionHeader={({ section }) =>
            section.title ? (
              <View style={styles.sectionHeader}>
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.size.xs,
                    fontWeight: theme.typography.weight.medium,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {section.title}
                </Text>
                {section.key === "recent" ? (
                  <Pressable onPress={() => void clearRecent()} accessibilityRole="button" testID="clear-recent">
                    <Text
                      style={{
                        color: theme.colors.textSecondary,
                        fontSize: theme.typography.size.xs,
                        fontWeight: theme.typography.weight.medium,
                      }}
                    >
                      {t("users.clearRecent")}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null
          }
          renderItem={({ item, section }) => {
            const reason = section.key === "suggestion" ? suggestionReason(item as SuggestedUser) : null;
            return (
              <View
                style={[
                  styles.row,
                  {
                    paddingVertical: theme.spacing.md,
                    borderBottomColor: theme.colors.border,
                  },
                ]}
              >
                <Pressable onPress={() => openProfile(item)} style={styles.rowTappable}>
                  <Avatar url={item.avatarUrl} name={item.name} size={44} />

                  <View style={styles.info}>
                    <Text
                      numberOfLines={1}
                      style={{
                        color: theme.colors.text,
                        fontSize: theme.typography.size.base,
                        fontWeight: theme.typography.weight.semibold,
                      }}
                    >
                      {item.username}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{ color: theme.colors.textSecondary, fontSize: theme.typography.size.sm }}
                    >
                      {item.name}
                    </Text>
                    {reason ? (
                      <Text
                        numberOfLines={1}
                        style={{ color: theme.colors.textTertiary, fontSize: theme.typography.size.xs }}
                      >
                        {reason}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>

                {section.key === "recent" ? (
                  <Pressable
                    onPress={() => void forget(item.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`${t("users.removeRecent")} ${item.username}`}
                    testID={`forget-${item.id}`}
                    style={styles.forget}
                  >
                    <Ionicons name="close" size={18} color={theme.colors.textTertiary} />
                  </Pressable>
                ) : (
                  <Button
                    title={getFollowLabel(item as User)}
                    variant={getFollowVariant(item as User)}
                    fullWidth={false}
                    loading={pendingIds.has(item.id)}
                    onPress={() => void toggleFollow(item as User)}
                  />
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            typing ? (
              <Text
                style={{
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.size.base,
                  textAlign: "center",
                  marginTop: theme.spacing.xxxl,
                }}
              >
                {t("users.noResults")}
              </Text>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchInput: {},
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    paddingBottom: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  rowTappable: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  info: {
    flex: 1,
  },
  forget: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
});
