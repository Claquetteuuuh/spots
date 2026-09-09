import React, { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
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
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { useTheme } from "../../theme";
import * as api from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { FollowListModal } from "../../components/profile/FollowListModal";
import type { RootStackParamList, RootStackNavigationProp } from "../../navigation/types";
import type { FollowStatus, Spot, User } from "../../types";

const GRID_COLUMNS = 3;
const GRID_GAP = 1;
const screenWidth = Dimensions.get("window").width;
const cellSize = (screenWidth - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

type OtherProfileRouteProp = RouteProp<RootStackParamList, "OtherProfile">;

export function OtherProfileScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation<RootStackNavigationProp>();
  const route = useRoute<OtherProfileRouteProp>();
  const { username } = route.params;

  const [profile, setProfile] = useState<User | null>(null);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followStatus, setFollowStatus] = useState<FollowStatus>(null);

  const loadProfile = useCallback(async () => {
    try {
      const userData = await api.getUserProfile(username);
      setProfile(userData);
      if (userData.followStatus) {
        setFollowStatus(userData.followStatus);
      } else if (userData.isFollowing) {
        setFollowStatus("ACCEPTED");
      } else {
        setFollowStatus(null);
      }

      const spotsData = await api.getSpots({ userId: userData.id });
      setSpots(spotsData.items);
    } catch {
      // Error
    } finally {
      setIsLoading(false);
    }
  }, [username]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  }, [loadProfile]);

  const handleFollowToggle = async () => {
    if (!profile) return;
    try {
      if (followStatus === "ACCEPTED" || followStatus === "PENDING") {
        await api.unfollowUser(profile.username);
        setFollowStatus(null);
        if (followStatus === "ACCEPTED") {
          setProfile((p) =>
            p ? { ...p, followerCount: Math.max(0, (p.followerCount ?? 0) - 1) } : p,
          );
        }
      } else {
        await api.followUser(profile.username);
        setFollowStatus("PENDING");
      }
    } catch {
      // Error
    }
  };

  if (isLoading || !profile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.bg }]} edges={["top"]}>
        <View style={styles.centered}>
          <Text style={{ color: theme.colors.textSecondary }}>{t("common.loading")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const initials = profile.name
    ?.split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() ?? "?";

  const spotsCount = profile.spotCount ?? spots.length;
  const followersCount = profile.followerCount ?? 0;
  const followingCount = profile.followingCount ?? 0;

  // 3-state button
  let followLabel = t("users.follow");
  let followVariant: "primary" | "secondary" = "primary";
  if (followStatus === "ACCEPTED") {
    followLabel = t("users.unfollow");
    followVariant = "secondary";
  } else if (followStatus === "PENDING") {
    followLabel = t("notifications.requested");
    followVariant = "secondary";
  }

  const [followModalVisible, setFollowModalVisible] = useState(false);
  const [followModalTab, setFollowModalTab] = useState<"followers" | "following">("followers");

  const openFollowList = (tab: "followers" | "following") => {
    setFollowModalTab(tab);
    setFollowModalVisible(true);
  };

  const openSpot = (spot: Spot) => navigation.navigate("SpotDetail", { spotId: spot.id });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.bg }]} edges={["top"]}>
      <FlatList
        data={spots}
        keyExtractor={(item) => item.id}
        numColumns={GRID_COLUMNS}
        columnWrapperStyle={{ gap: GRID_GAP }}
        contentContainerStyle={{ gap: GRID_GAP, paddingBottom: theme.spacing.xxl }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.textSecondary}
          />
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => openSpot(item)} style={styles.gridItem}>
            <Image source={{ uri: item.photoUrl }} style={styles.gridImage} resizeMode="cover" />
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={{ padding: theme.spacing.xxxl, alignItems: "center" }}>
            <Text style={{ color: theme.colors.textSecondary, fontSize: theme.typography.size.base }}>
              {t("spots.noSpots")}
            </Text>
          </View>
        }
        ListHeaderComponent={
          <View
            style={{
              paddingHorizontal: theme.spacing.lg,
              paddingTop: theme.spacing.lg,
              paddingBottom: theme.spacing.xl,
            }}
          >
            {/* Avatar + Stats */}
            <View style={styles.headerRow}>
              {profile.avatarUrl ? (
                <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
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
                      fontSize: theme.typography.size.xl,
                      fontWeight: theme.typography.weight.semibold,
                    }}
                  >
                    {initials}
                  </Text>
                </View>
              )}

              <View style={styles.statsRow}>
                <Stat
                  label="spots"
                  value={String(spotsCount)}
                  theme={theme}
                />
                <Pressable onPress={() => openFollowList("followers")}>
                  <Stat
                    label={t("users.followers")}
                    value={String(followersCount)}
                    theme={theme}
                  />
                </Pressable>
                <Pressable onPress={() => openFollowList("following")}>
                  <Stat
                    label={t("users.following")}
                    value={String(followingCount)}
                    theme={theme}
                  />
                </Pressable>
              </View>
            </View>

            {/* Name + username + bio */}
            <Text
              style={{
                color: theme.colors.text,
                fontSize: theme.typography.size.base,
                fontWeight: theme.typography.weight.semibold,
                marginTop: theme.spacing.lg,
              }}
            >
              {profile.name}
            </Text>
            <Text
              style={{
                color: theme.colors.textSecondary,
                fontSize: theme.typography.size.sm,
                marginTop: 2,
              }}
            >
              @{profile.username}
            </Text>
            {profile.bio ? (
              <Text
                style={{
                  color: theme.colors.text,
                  fontSize: theme.typography.size.sm,
                  marginTop: theme.spacing.xs,
                  lineHeight: theme.typography.size.sm * theme.typography.lineHeight.normal,
                }}
              >
                {profile.bio}
              </Text>
            ) : null}

            {/* Follow button */}
            <View style={{ marginTop: theme.spacing.lg }}>
              <Button
                title={followLabel}
                variant={followVariant}
                onPress={handleFollowToggle}
              />
            </View>
          </View>
        }
      />

      <FollowListModal
        visible={followModalVisible}
        onClose={() => setFollowModalVisible(false)}
        username={profile.username}
        initialTab={followModalTab}
      />
    </SafeAreaView>
  );
}

function Stat({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={styles.stat}>
      <Text
        style={{
          color: theme.colors.text,
          fontSize: theme.typography.size.lg,
          fontWeight: theme.typography.weight.bold,
        }}
      >
        {value}
      </Text>
      <Text style={{ color: theme.colors.textSecondary, fontSize: theme.typography.size.xs }}>
        {label}
      </Text>
    </View>
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 9999,
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    marginLeft: 16,
  },
  stat: {
    alignItems: "center",
  },
  gridItem: {
    width: cellSize,
    height: cellSize,
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
});
