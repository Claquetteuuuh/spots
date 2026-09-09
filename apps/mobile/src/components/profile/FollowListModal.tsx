import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import PagerView from "react-native-pager-view";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../theme";
import { useAuthStore } from "../../stores/auth-store";
import * as api from "../../lib/api";
import { Button } from "../ui/Button";
import type { RootStackNavigationProp } from "../../navigation/types";
import type { User } from "../../types";

type Tab = "followers" | "following";
const TAB_INDEX: Record<Tab, number> = { followers: 0, following: 1 };
const INDEX_TAB: Tab[] = ["followers", "following"];

const SCREEN_WIDTH = Dimensions.get("window").width;
const TAB_WIDTH = SCREEN_WIDTH / 2;

const SPRING_CONFIG = {
  damping: 20,
  stiffness: 200,
  mass: 0.5,
};

interface FollowListModalProps {
  visible: boolean;
  onClose: () => void;
  username: string;
  initialTab: Tab;
}

export function FollowListModal({
  visible,
  onClose,
  username,
  initialTab,
}: FollowListModalProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation<RootStackNavigationProp>();
  const currentUser = useAuthStore((s) => s.user);
  const pagerRef = useRef<PagerView>(null);

  const [tab, setTab] = useState<Tab>(initialTab);
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unfollowedIds, setUnfollowedIds] = useState<Set<string>>(new Set());

  // Animated tab indicator
  const indicatorX = useSharedValue(TAB_INDEX[initialTab] * TAB_WIDTH);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  useEffect(() => {
    setTab(initialTab);
    indicatorX.value = withSpring(TAB_INDEX[initialTab] * TAB_WIDTH, SPRING_CONFIG);
    pagerRef.current?.setPage(TAB_INDEX[initialTab]);
  }, [initialTab, indicatorX]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [f, g] = await Promise.all([
        api.getFollowers(username),
        api.getFollowing(username),
      ]);
      setFollowers(f);
      setFollowing(g);
      setUnfollowedIds(new Set());
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }, [username]);

  useEffect(() => {
    if (visible) {
      void loadData();
    }
  }, [visible, loadData]);

  const handleTabPress = (t: Tab) => {
    setTab(t);
    indicatorX.value = withSpring(TAB_INDEX[t] * TAB_WIDTH, SPRING_CONFIG);
    pagerRef.current?.setPage(TAB_INDEX[t]);
  };

  const handlePageSelected = (e: { nativeEvent: { position: number } }) => {
    const pos = e.nativeEvent.position;
    setTab(INDEX_TAB[pos]);
    indicatorX.value = withSpring(pos * TAB_WIDTH, SPRING_CONFIG);
  };

  const handleUnfollow = async (user: User) => {
    try {
      await api.unfollowUser(user.username);
      setUnfollowedIds((prev) => new Set(prev).add(user.id));
    } catch {
      // Silently fail
    }
  };

  const handleFollow = async (user: User) => {
    try {
      await api.followUser(user.username);
      setUnfollowedIds((prev) => {
        const next = new Set(prev);
        next.delete(user.id);
        return next;
      });
    } catch {
      // Silently fail
    }
  };

  const navigateToProfile = (user: User) => {
    onClose();
    if (user.username === currentUser?.username) {
      return;
    }
    navigation.navigate("OtherProfile", { username: user.username });
  };

  const isOwnProfile = username === currentUser?.username;

  const renderUser = (item: User, currentTab: Tab) => {
    const isCurrentUser = item.id === currentUser?.id;
    const wasUnfollowed = unfollowedIds.has(item.id);
    const showButton = !isCurrentUser && isOwnProfile && currentTab === "following";

    return (
      <Pressable
        key={item.id}
        onPress={() => navigateToProfile(item)}
        style={[styles.userRow, { borderBottomColor: theme.colors.border }]}
      >
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.userAvatar} />
        ) : (
          <View
            style={[
              styles.userAvatar,
              styles.avatarPlaceholder,
              { backgroundColor: theme.colors.bgTertiary },
            ]}
          >
            <Text style={{ color: theme.colors.textSecondary, fontSize: 16, fontWeight: "600" }}>
              {item.name?.charAt(0)?.toUpperCase() ?? "?"}
            </Text>
          </View>
        )}

        <View style={styles.userInfo}>
          <Text
            style={{
              color: theme.colors.text,
              fontSize: theme.typography.size.sm,
              fontWeight: theme.typography.weight.semibold,
            }}
            numberOfLines={1}
          >
            {item.username}
          </Text>
          <Text
            style={{ color: theme.colors.textSecondary, fontSize: theme.typography.size.xs }}
            numberOfLines={1}
          >
            {item.name}
          </Text>
        </View>

        {showButton ? (
          wasUnfollowed ? (
            <Button
              title={t("users.follow")}
              variant="primary"
              fullWidth={false}
              onPress={() => handleFollow(item)}
            />
          ) : (
            <Button
              title={t("users.unfollow")}
              variant="secondary"
              fullWidth={false}
              onPress={() => handleUnfollow(item)}
            />
          )
        ) : null}
      </Pressable>
    );
  };

  const renderList = (data: User[], currentTab: Tab, emptyText: string) => (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => renderUser(item, currentTab)}
      contentContainerStyle={{ flexGrow: 1 }}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={{ color: theme.colors.textSecondary, fontSize: theme.typography.size.sm }}>
            {emptyText}
          </Text>
        </View>
      }
    />
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </Pressable>
          <Text
            style={{
              color: theme.colors.text,
              fontSize: theme.typography.size.base,
              fontWeight: theme.typography.weight.semibold,
              flex: 1,
              textAlign: "center",
            }}
          >
            {username}
          </Text>
          <View style={styles.closeButton} />
        </View>

        {/* Tabs with animated indicator */}
        <View style={[styles.tabRow, { borderBottomColor: theme.colors.border }]}>
          <Pressable onPress={() => handleTabPress("followers")} style={styles.tab}>
            <Text
              style={{
                color: tab === "followers" ? theme.colors.text : theme.colors.textSecondary,
                fontSize: theme.typography.size.sm,
                fontWeight: theme.typography.weight.semibold,
                textAlign: "center",
              }}
            >
              {t("users.followers")}
            </Text>
          </Pressable>
          <Pressable onPress={() => handleTabPress("following")} style={styles.tab}>
            <Text
              style={{
                color: tab === "following" ? theme.colors.text : theme.colors.textSecondary,
                fontSize: theme.typography.size.sm,
                fontWeight: theme.typography.weight.semibold,
                textAlign: "center",
              }}
            >
              {t("users.following")}
            </Text>
          </Pressable>

          {/* Sliding indicator */}
          <Animated.View
            style={[
              styles.indicator,
              { backgroundColor: theme.colors.text },
              indicatorStyle,
            ]}
          />
        </View>

        {/* Swipeable content */}
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={theme.colors.textSecondary} />
          </View>
        ) : (
          <PagerView
            ref={pagerRef}
            style={styles.pager}
            initialPage={TAB_INDEX[initialTab]}
            onPageSelected={handlePageSelected}
          >
            <View key="followers" style={styles.page}>
              {renderList(followers, "followers", t("users.noFollowers"))}
            </View>
            <View key="following" style={styles.page}>
              {renderList(following, "following", t("users.noFollowing"))}
            </View>
          </PagerView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeButton: {
    width: 32,
    alignItems: "center",
  },
  tabRow: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    position: "relative",
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
  },
  indicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: TAB_WIDTH,
    height: 1.5,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
});
