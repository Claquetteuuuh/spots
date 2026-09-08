import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../theme";
import { searchUsers, followUser, unfollowUser } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import type { User } from "../../types";

const SEARCH_DEBOUNCE_MS = 350;

export function SearchScreen() {
  const { t } = useTranslation();
  const theme = useTheme();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const toggleFollow = async (user: User) => {
    setPendingIds((prev) => new Set(prev).add(user.id));
    const wasFollowing = Boolean(user.isFollowing);
    setResults((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, isFollowing: !wasFollowing } : u))
    );
    try {
      if (wasFollowing) {
        await unfollowUser(user.username);
      } else {
        await followUser(user.username);
      }
    } catch {
      setResults((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isFollowing: wasFollowing } : u))
      );
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(user.id);
        return next;
      });
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.bg }]} edges={["top"]}>
      <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg, paddingBottom: theme.spacing.md }}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t("users.searchPlaceholder")}
          placeholderTextColor={theme.colors.textTertiary}
          autoCapitalize="none"
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
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: theme.spacing.lg }}
          renderItem={({ item }) => (
            <View
              style={[
                styles.row,
                {
                  paddingVertical: theme.spacing.md,
                  borderBottomColor: theme.colors.border,
                },
              ]}
            >
              {item.avatarUrl ? (
                <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
              ) : (
                <View
                  style={[
                    styles.avatar,
                    styles.avatarPlaceholder,
                    { backgroundColor: theme.colors.bgTertiary },
                  ]}
                >
                  <Text style={{ color: theme.colors.textSecondary, fontWeight: "600", fontSize: theme.typography.size.base }}>
                    {item.name.slice(0, 1).toUpperCase()}
                  </Text>
                </View>
              )}

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
              </View>

              <Button
                title={item.isFollowing ? t("users.unfollow") : t("users.follow")}
                variant={item.isFollowing ? "secondary" : "primary"}
                fullWidth={false}
                loading={pendingIds.has(item.id)}
                onPress={() => void toggleFollow(item)}
              />
            </View>
          )}
          ListEmptyComponent={
            query.trim().length > 0 ? (
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 9999,
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
  },
});
