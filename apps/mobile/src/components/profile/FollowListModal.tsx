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
import type { SentFollowRequest, User } from "../../types";

type Tab = "followers" | "following" | "requests";

const SCREEN_WIDTH = Dimensions.get("window").width;

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

  const isOwnProfile = username === currentUser?.username;
  const tabs: Tab[] = isOwnProfile
    ? ["followers", "following", "requests"]
    : ["followers", "following"];

  const tabCount = tabs.length;
  const tabWidth = SCREEN_WIDTH / tabCount;

  const tabIndex = (t_: Tab) => tabs.indexOf(t_);

  const [tab, setTab] = useState<Tab>(initialTab);
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [sentRequests, setSentRequests] = useState<SentFollowRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unfollowedIds, setUnfollowedIds] = useState<Set<string>>(new Set());
  const [cancelledIds, setCancelledIds] = useState<Set<string>>(new Set());

  // Animated tab indicator
  const indicatorX = useSharedValue(tabIndex(initialTab) * tabWidth);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: tabWidth,
  }));

  useEffect(() => {
    setTab(initialTab);
    indicatorX.value = withSpring(tabIndex(initialTab) * tabWidth, SPRING_CONFIG);
    pagerRef.current?.setPage(tabIndex(initialTab));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTab]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const promises: [Promise<User[]>, Promise<User[]>, Promise<SentFollowRequest[]>?] = [
        api.getFollowers(username),
        api.getFollowing(username),
      ];
      if (isOwnProfile) {
        promises.push(api.getSentFollowRequests());
      }
      const [f, g, sent] = await Promise.all(promises);
      setFollowers(f);
      setFollowing(g);
      setSentRequests(sent ?? []);
      setUnfollowedIds(new Set());
      setCancelledIds(new Set());
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }, [username, isOwnProfile]);

  useEffect(() => {
    if (visible) {
      void loadData();
    }
  }, [visible, loadData]);

  const handleTabPress = (t_: Tab) => {
    const idx = tabIndex(t_);
    setTab(t_);
    indicatorX.value = withSpring(idx * tabWidth, SPRING_CONFIG);
    pagerRef.current?.setPage(idx);
  };

  const handlePageSelected = (e: { nativeEvent: { position: number } }) => {
    const pos = e.nativeEvent.position;
    const selectedTab = tabs[pos];
    setTab(selectedTab);
    indicatorX.value = withSpring(pos * tabWidth, SPRING_CONFIG);
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

  const handleCancelRequest = async (req: SentFollowRequest) => {
    try {
      await api.unfollowUser(req.following.username);
      setCancelledIds((prev) => new Set(prev).add(req.id));
    } catch {
      // Silently fail
    }
  };

  const navigateToProfile = (profileUsername: string) => {
    onClose();
    if (profileUsername === currentUser?.username) {
      return;
    }
    navigation.navigate("OtherProfile", { username: profileUsername });
  };

  const renderUser = (item: User, currentTab: Tab) => {
    const isCurrentUser = item.id === currentUser?.id;
    const wasUnfollowed = unfollowedIds.has(item.id);
    const showButton = !isCurrentUser && isOwnProfile && currentTab === "following";

    return (
      <Pressable
        key={item.id}
        onPress={() => navigateToProfile(item.username)}
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

  const renderSentRequest = (item: SentFollowRequest) => {
    if (cancelledIds.has(item.id)) return null;

    return (
      <Pressable
        key={item.id}
        onPress={() => navigateToProfile(item.following.username)}
        style={[styles.userRow, { borderBottomColor: theme.colors.border }]}
      >
        {item.following.avatarUrl ? (
          <Image source={{ uri: item.following.avatarUrl }} style={styles.userAvatar} />
        ) : (
          <View
            style={[
              styles.userAvatar,
              styles.avatarPlaceholder,
              { backgroundColor: theme.colors.bgTertiary },
            ]}
          >
            <Text style={{ color: theme.colors.textSecondary, fontSize: 16, fontWeight: "600" }}>
              {item.following.name?.charAt(0)?.toUpperCase() ?? "?"}
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
            {item.following.username}
          </Text>
          <Text
            style={{ color: theme.colors.textSecondary, fontSize: theme.typography.size.xs }}
            numberOfLines={1}
          >
            {item.following.name}
          </Text>
        </View>

        <Button
          title={t("users.cancelRequest")}
          variant="secondary"
          fullWidth={false}
          onPress={() => handleCancelRequest(item)}
        />
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

  const visibleRequests = sentRequests.filter((r) => !cancelledIds.has(r.id));

  const renderRequestsList = () => (
    <FlatList
      data={visibleRequests}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => renderSentRequest(item) as React.ReactElement}
      contentContainerStyle={{ flexGrow: 1 }}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={{ color: theme.colors.textSecondary, fontSize: theme.typography.size.sm }}>
            {t("users.noRequests")}
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
          {tabs.map((t_) => (
            <Pressable key={t_} onPress={() => handleTabPress(t_)} style={styles.tab}>
              <Text
                style={{
                  color: tab === t_ ? theme.colors.text : theme.colors.textSecondary,
                  fontSize: theme.typography.size.sm,
                  fontWeight: theme.typography.weight.semibold,
                  textAlign: "center",
                }}
              >
                {t_ === "followers"
                  ? t("users.followers")
                  : t_ === "following"
                    ? t("users.following")
                    : t("users.requests")}
              </Text>
            </Pressable>
          ))}

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
            initialPage={tabIndex(initialTab)}
            onPageSelected={handlePageSelected}
          >
            <View key="followers" style={styles.page}>
              {renderList(followers, "followers", t("users.noFollowers"))}
            </View>
            <View key="following" style={styles.page}>
              {renderList(following, "following", t("users.noFollowing"))}
            </View>
            {isOwnProfile && (
              <View key="requests" style={styles.page}>
                {renderRequestsList()}
              </View>
            )}
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
