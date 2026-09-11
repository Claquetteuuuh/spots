import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../theme";
import * as api from "../../lib/api";
import type { FollowRequest, NotificationsData } from "../../types";
import type { RootStackNavigationProp } from "../../navigation/types";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w`;
}

function initialsOf(name: string | null | undefined): string {
  const initials = name
    ?.split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return initials || "?";
}

export function NotificationsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation<RootStackNavigationProp>();

  const [data, setData] = useState<NotificationsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const result = await api.getFollowRequests();
      setData(result);
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleAccept = async (id: string) => {
    try {
      await api.acceptFollowRequest(id);
      setData((prev) =>
        prev
          ? {
              ...prev,
              pendingRequests: prev.pendingRequests.filter((r) => r.id !== id),
            }
          : prev,
      );
    } catch {
      // Error
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.rejectFollowRequest(id);
      setData((prev) =>
        prev
          ? {
              ...prev,
              pendingRequests: prev.pendingRequests.filter((r) => r.id !== id),
            }
          : prev,
      );
    } catch {
      // Error
    }
  };

  const renderAvatar = (avatarUrl: string | null, name: string | null) => {
    if (avatarUrl) {
      return (
        <Image
          source={{ uri: avatarUrl }}
          style={[styles.avatar, { borderColor: theme.colors.border }]}
        />
      );
    }
    return (
      <View
        style={[
          styles.avatar,
          styles.avatarPlaceholder,
          { backgroundColor: theme.colors.bgTertiary },
        ]}
      >
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontSize: theme.typography.size.sm,
            fontWeight: theme.typography.weight.semibold,
          }}
        >
          {initialsOf(name)}
        </Text>
      </View>
    );
  };

  const renderRequest = (item: FollowRequest) => (
    <View
      key={item.id}
      style={[styles.requestRow, { borderBottomColor: theme.colors.border }]}
    >
      <Pressable
        onPress={() =>
          navigation.navigate("OtherProfile", {
            username: item.follower.username,
          })
        }
        style={styles.avatarWrap}
      >
        {renderAvatar(item.follower.avatarUrl, item.follower.name)}
      </Pressable>

      <Pressable
        onPress={() =>
          navigation.navigate("OtherProfile", {
            username: item.follower.username,
          })
        }
        style={styles.infoWrap}
      >
        <Text
          style={{
            color: theme.colors.text,
            fontSize: theme.typography.size.sm,
            fontWeight: theme.typography.weight.semibold,
          }}
          numberOfLines={1}
        >
          {item.follower.username}
        </Text>
        <Text
          style={{
            color: theme.colors.textTertiary,
            fontSize: theme.typography.size.xs,
          }}
          numberOfLines={1}
        >
          {item.follower.name}
        </Text>
      </Pressable>

      <View style={styles.actions}>
        <Pressable
          onPress={() => handleAccept(item.id)}
          style={[
            styles.actionButton,
            {
              backgroundColor: theme.colors.accent,
              borderRadius: theme.radius.sm,
            },
          ]}
        >
          <Text
            style={{
              color: theme.colors.onAccent,
              fontSize: theme.typography.size.xs,
              fontWeight: theme.typography.weight.semibold,
            }}
          >
            {t("notifications.accept")}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => handleReject(item.id)}
          style={[
            styles.actionButton,
            {
              backgroundColor: theme.colors.bgSecondary,
              borderRadius: theme.radius.sm,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text
            style={{
              color: theme.colors.text,
              fontSize: theme.typography.size.xs,
              fontWeight: theme.typography.weight.semibold,
            }}
          >
            {t("notifications.reject")}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  const renderFollower = (item: FollowRequest) => (
    <Pressable
      key={item.id}
      onPress={() =>
        navigation.navigate("OtherProfile", {
          username: item.follower.username,
        })
      }
      style={[styles.requestRow, { borderBottomColor: theme.colors.border }]}
    >
      <View style={styles.avatarWrap}>
        {renderAvatar(item.follower.avatarUrl, item.follower.name)}
      </View>

      <View style={styles.infoWrap}>
        <Text numberOfLines={1}>
          <Text
            style={{
              color: theme.colors.text,
              fontSize: theme.typography.size.sm,
              fontWeight: theme.typography.weight.semibold,
            }}
          >
            {item.follower.username}
          </Text>
          {"  "}
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontSize: theme.typography.size.sm,
            }}
          >
            {t("notifications.startedFollowing")}
          </Text>
        </Text>
      </View>

      <Text
        style={{
          color: theme.colors.textTertiary,
          fontSize: theme.typography.size.xs,
        }}
      >
        {timeAgo(item.createdAt)}
      </Text>
    </Pressable>
  );

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.bg }]}
        edges={["top"]}
      >
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.textSecondary} />
        </View>
      </SafeAreaView>
    );
  }

  const pendingRequests = data?.pendingRequests ?? [];
  const newFollowers = data?.newFollowers ?? [];
  const hasContent = pendingRequests.length > 0 || newFollowers.length > 0;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.bg }]}
      edges={["top"]}
    >
      {/* Header */}
      <View
        style={[styles.header, { borderBottomColor: theme.colors.border }]}
      >
        <Text
          style={{
            color: theme.colors.text,
            fontSize: theme.typography.size.md,
            fontWeight: theme.typography.weight.semibold,
          }}
        >
          {t("notifications.title")}
        </Text>
      </View>

      {hasContent ? (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.textSecondary}
            />
          }
        >
          {/* Pending follow requests */}
          {pendingRequests.length > 0 && (
            <>
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingTop: 16,
                  paddingBottom: 8,
                }}
              >
                <Text
                  style={{
                    color: theme.colors.text,
                    fontSize: theme.typography.size.sm,
                    fontWeight: theme.typography.weight.semibold,
                  }}
                >
                  {t("notifications.followRequests")}
                </Text>
              </View>
              {pendingRequests.map(renderRequest)}
            </>
          )}

          {/* New followers */}
          {newFollowers.length > 0 && (
            <>
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingTop: 16,
                  paddingBottom: 8,
                }}
              >
                <Text
                  style={{
                    color: theme.colors.text,
                    fontSize: theme.typography.size.sm,
                    fontWeight: theme.typography.weight.semibold,
                  }}
                >
                  {t("notifications.newFollowers")}
                </Text>
              </View>
              {newFollowers.map(renderFollower)}
            </>
          )}
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.emptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.textSecondary}
            />
          }
        >
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontSize: theme.typography.size.base,
            }}
          >
            {t("notifications.noNotifications")}
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    height: 48,
    justifyContent: "center",
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  requestRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatarWrap: {
    flexShrink: 0,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 9999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  infoWrap: {
    flex: 1,
    minWidth: 0,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    flexShrink: 0,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 64,
  },
});
