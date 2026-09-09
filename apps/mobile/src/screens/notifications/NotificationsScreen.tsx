import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../theme";
import * as api from "../../lib/api";
import type { FollowRequest } from "../../types";
import type { RootStackNavigationProp } from "../../navigation/types";

export function NotificationsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation<RootStackNavigationProp>();

  const [requests, setRequests] = useState<FollowRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRequests = useCallback(async () => {
    try {
      const data = await api.getFollowRequests();
      setRequests(data);
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  }, [loadRequests]);

  const handleAccept = async (id: string) => {
    try {
      await api.acceptFollowRequest(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // Error
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.rejectFollowRequest(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // Error
    }
  };

  const renderRequest = ({ item }: { item: FollowRequest }) => {
    const initials =
      item.follower.name
        ?.split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase() ?? "?";

    return (
      <View style={[styles.requestRow, { borderBottomColor: theme.colors.border }]}>
        <Pressable
          onPress={() => navigation.navigate("OtherProfile", { username: item.follower.username })}
          style={styles.avatarWrap}
        >
          {item.follower.avatarUrl ? (
            <Image
              source={{ uri: item.follower.avatarUrl }}
              style={[styles.avatar, { borderColor: theme.colors.border }]}
            />
          ) : (
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
                {initials}
              </Text>
            </View>
          )}
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate("OtherProfile", { username: item.follower.username })}
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
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.bg }]} edges={["top"]}>
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.textSecondary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.bg }]} edges={["top"]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { borderBottomColor: theme.colors.border },
        ]}
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

      {requests.length > 0 ? (
        <>
          <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
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
          <FlatList
            data={requests}
            keyExtractor={(item) => item.id}
            renderItem={renderRequest}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={theme.colors.textSecondary}
              />
            }
          />
        </>
      ) : (
        <View style={styles.emptyState}>
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontSize: theme.typography.size.base,
            }}
          >
            {t("notifications.noNotifications")}
          </Text>
        </View>
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
