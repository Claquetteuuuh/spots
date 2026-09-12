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
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme";
import { Avatar } from "../../components/Avatar";
import * as api from "../../lib/api";
import { useNotificationsStore } from "../../stores/notifications-store";
import type {
  FollowRequest,
  LikeNotification,
  NotificationBase,
  NotificationsData,
} from "../../types";
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

const isUnread = (n: NotificationBase) => !n.readAt;

export function NotificationsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation<RootStackNavigationProp>();

  const [data, setData] = useState<NotificationsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // Unread when the screen opened: keeps its dot while it is on screen,
  // even though the server counts it read from now on.
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    try {
      const result = await api.getFollowRequests();
      const likes = result.likes ?? [];
      const all: NotificationBase[] = [...result.pendingRequests, ...result.newFollowers, ...likes];
      setFreshIds(new Set(all.filter((n) => isUnread(n) && !n.unreadKept).map((n) => n.id)));
      // Seen: never-read items are read from now on; the badge goes
      void useNotificationsStore.getState().markSeen();
      const now = new Date().toISOString();
      const readNow = <N extends NotificationBase>(n: N): N =>
        isUnread(n) && !n.unreadKept ? { ...n, readAt: now } : n;
      setData({
        pendingRequests: result.pendingRequests.map(readNow),
        newFollowers: result.newFollowers.map(readNow),
        likes: likes.map(readNow),
      });
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

  /** Merge a change into one notification, whichever list it sits in — null takes it out. */
  const patch = (id: string, update: (n: NotificationBase) => Partial<NotificationBase> | null) => {
    setData((prev) => {
      if (!prev) return prev;
      const apply = <N extends NotificationBase>(list: N[]): N[] =>
        list.flatMap((n) => {
          if (n.id !== id) return [n];
          const next = update(n);
          return next ? [{ ...n, ...next }] : [];
        });
      return {
        pendingRequests: apply(prev.pendingRequests),
        newFollowers: apply(prev.newFollowers),
        likes: apply(prev.likes ?? []),
      };
    });
  };

  const handleAccept = async (id: string) => {
    try {
      await api.acceptFollowRequest(id);
      patch(id, () => null);
    } catch {
      // Error
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.rejectFollowRequest(id);
      patch(id, () => null);
    } catch {
      // Error
    }
  };

  const handleToggleRead = async (item: NotificationBase) => {
    const read = isUnread(item); // unread → read, read → unread
    try {
      await api.setNotificationRead(item.id, read);
      setFreshIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
      patch(item.id, () => ({
        readAt: read ? new Date().toISOString() : null,
        unreadKept: !read,
      }));
      void useNotificationsStore.getState().refresh();
    } catch {
      // Error
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await api.dismissNotification(id);
      patch(id, () => null);
      void useNotificationsStore.getState().refresh();
    } catch {
      // Error
    }
  };

  /** The unread dot — the app's device for state — or its empty place. */
  const renderDot = (item: NotificationBase) => (
    <View
      testID={`dot-${item.id}`}
      style={[
        styles.dot,
        {
          backgroundColor:
            isUnread(item) || freshIds.has(item.id) ? theme.colors.accent : "transparent",
        },
      ]}
    />
  );

  /**
   * The two actions a slide reveals: blue to flip read/unread (an
   * envelope, with a dot when it would mark unread), red with a bin to
   * delete.
   */
  const renderActions = (item: NotificationBase, close: () => void) => {
    const unread = isUnread(item);
    return (
      <View style={styles.swipeActions}>
        <Pressable
          onPress={() => {
            close();
            void handleToggleRead(item);
          }}
          accessibilityRole="button"
          accessibilityLabel={unread ? t("notifications.markRead") : t("notifications.markUnread")}
          testID={`toggle-read-${item.id}`}
          style={[styles.swipeButton, { backgroundColor: theme.colors.accent }]}
        >
          <Ionicons
            name={unread ? "mail-open-outline" : "mail-unread-outline"}
            size={22}
            color={theme.colors.onAccent}
          />
        </Pressable>
        <Pressable
          onPress={() => void handleDismiss(item.id)}
          accessibilityRole="button"
          accessibilityLabel={t("common.delete")}
          testID={`dismiss-${item.id}`}
          style={[styles.swipeButton, { backgroundColor: theme.colors.error }]}
        >
          <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
        </Pressable>
      </View>
    );
  };

  const swipeable = (item: NotificationBase, row: React.ReactNode) => (
    <ReanimatedSwipeable
      key={item.id}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      renderRightActions={(_progress, _translation, methods) => renderActions(item, methods.close)}
    >
      {row}
    </ReanimatedSwipeable>
  );

  const renderRequest = (item: FollowRequest) =>
    swipeable(
      item,
      <View
        style={[styles.requestRow, { borderBottomColor: theme.colors.border, backgroundColor: theme.colors.bg }]}
        testID={`notification-${item.id}`}
      >
        {renderDot(item)}
        <Pressable
          onPress={() =>
            navigation.navigate("OtherProfile", {
              username: item.follower.username,
            })
          }
          style={styles.avatarWrap}
        >
          <Avatar url={item.follower.avatarUrl} name={item.follower.name} size={44} style={{ borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border }} />
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
      </View>,
    );

  const renderFollower = (item: FollowRequest) =>
    swipeable(
      item,
      <Pressable
        onPress={() =>
          navigation.navigate("OtherProfile", {
            username: item.follower.username,
          })
        }
        style={[styles.requestRow, { borderBottomColor: theme.colors.border, backgroundColor: theme.colors.bg }]}
        testID={`notification-${item.id}`}
      >
        {renderDot(item)}
        <View style={styles.avatarWrap}>
          <Avatar url={item.follower.avatarUrl} name={item.follower.name} size={44} style={{ borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border }} />
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
      </Pressable>,
    );

  const renderLike = (item: LikeNotification) =>
    swipeable(
      item,
      <Pressable
        onPress={() => navigation.navigate("SpotDetail", { spotId: item.spot.id })}
        style={[styles.requestRow, { borderBottomColor: theme.colors.border, backgroundColor: theme.colors.bg }]}
        testID={`notification-${item.id}`}
      >
        {renderDot(item)}
        <View style={styles.avatarWrap}>
          <Avatar url={item.user.avatarUrl} name={item.user.name} size={44} style={{ borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border }} />
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
              {item.user.username}
            </Text>
            {"  "}
            <Text
              style={{
                color: theme.colors.textSecondary,
                fontSize: theme.typography.size.sm,
              }}
            >
              {t("notifications.likedSpot")}
            </Text>
          </Text>
          {item.spot.title ? (
            <Text
              numberOfLines={1}
              style={{ color: theme.colors.textTertiary, fontSize: theme.typography.size.xs, marginTop: 2 }}
            >
              {item.spot.title}
            </Text>
          ) : null}
        </View>

        {/* The spot itself, so the row is recognisable at a glance */}
        <Image
          source={{ uri: item.spot.photoUrl }}
          style={{ width: 44, height: 44, borderRadius: theme.radius.sm }}
          accessibilityIgnoresInvertColors
        />

        <Text
          style={{
            color: theme.colors.textTertiary,
            fontSize: theme.typography.size.xs,
          }}
        >
          {timeAgo(item.createdAt)}
        </Text>
      </Pressable>,
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
  const likes = data?.likes ?? [];
  const hasContent = pendingRequests.length > 0 || newFollowers.length > 0 || likes.length > 0;

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

          {/* Likes on the viewer's spots */}
          {likes.length > 0 && (
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
                  {t("notifications.likes")}
                </Text>
              </View>
              {likes.map(renderLike)}
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
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  avatarWrap: {
    flexShrink: 0,
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
  // Revealed by a slide to the left: two full-height squares, blue then red
  swipeActions: {
    flexDirection: "row",
  },
  swipeButton: {
    width: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 64,
  },
});
