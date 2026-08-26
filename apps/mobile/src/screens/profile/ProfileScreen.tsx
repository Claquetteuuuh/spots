import React, { useEffect } from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../theme";
import { useAuthStore } from "../../stores/auth-store";
import { useSpotsStore } from "../../stores/spots-store";
import { Button } from "../../components/ui/Button";
import type { MainTabNavigationProp } from "../../navigation/types";
import type { Spot } from "../../types";

const GRID_COLUMNS = 3;

export function ProfileScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation<MainTabNavigationProp<"Profile">>();

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const spots = useSpotsStore((s) => s.spots);
  const fetchMySpots = useSpotsStore((s) => s.fetchMySpots);

  useEffect(() => {
    if (user) void fetchMySpots(user.id);
  }, [user, fetchMySpots]);

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const openSpot = (spot: Spot) => navigation.navigate("SpotDetail", { spotId: spot.id });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.bg }]} edges={["top"]}>
      <FlatList
        data={spots}
        keyExtractor={(item) => item.id}
        numColumns={GRID_COLUMNS}
        columnWrapperStyle={{ gap: 2 }}
        contentContainerStyle={{ gap: 2, paddingBottom: theme.spacing.xxl }}
        renderItem={({ item }) => (
          <Pressable onPress={() => openSpot(item)} style={styles.gridItem}>
            <Image source={{ uri: item.photoUrl }} style={styles.gridImage} resizeMode="cover" />
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={{ padding: theme.spacing.xl, alignItems: "center" }}>
            <Text style={{ color: theme.colors.textSecondary, fontSize: theme.typography.size.base }}>
              {t("spots.noSpots")}
            </Text>
          </View>
        }
        ListHeaderComponent={
          <View style={{ padding: theme.spacing.xl }}>
            <View style={styles.headerRow}>
              {user.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
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
                      fontSize: theme.typography.size.lg,
                      fontWeight: theme.typography.weight.semibold,
                    }}
                  >
                    {initials}
                  </Text>
                </View>
              )}

              <View style={styles.statsRow}>
                <Stat label={t("users.spots", { count: spots.length })} value={String(spots.length)} theme={theme} />
                <Stat
                  label={t("users.followers")}
                  value={String(user.followerCount ?? 0)}
                  theme={theme}
                />
                <Stat
                  label={t("users.following")}
                  value={String(user.followingCount ?? 0)}
                  theme={theme}
                />
              </View>
            </View>

            <Text
              style={{
                color: theme.colors.text,
                fontSize: theme.typography.size.lg,
                fontWeight: theme.typography.weight.semibold,
                marginTop: theme.spacing.lg,
              }}
            >
              {user.name}
            </Text>
            <Text
              style={{
                color: theme.colors.textSecondary,
                fontSize: theme.typography.size.sm,
                marginTop: 2,
              }}
            >
              @{user.username}
            </Text>
            {user.bio ? (
              <Text
                style={{
                  color: theme.colors.text,
                  fontSize: theme.typography.size.sm,
                  marginTop: theme.spacing.sm,
                }}
              >
                {user.bio}
              </Text>
            ) : null}

            <View style={[styles.actionsRow, { marginTop: theme.spacing.lg, gap: theme.spacing.sm }]}>
              <Button
                title={t("users.editProfile")}
                variant="secondary"
                onPress={() => navigation.navigate("EditProfile")}
                fullWidth={false}
                style={{ flex: 1 }}
              />
              <Button
                title={t("auth.logout")}
                variant="ghost"
                onPress={() => void logout()}
                fullWidth={false}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function Stat({ label, value, theme }: { label: string; value: string; theme: ReturnType<typeof useTheme> }) {
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
      <Text style={{ color: theme.colors.textSecondary, fontSize: theme.typography.size.xs }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  stat: {
    alignItems: "center",
  },
  actionsRow: {
    flexDirection: "row",
  },
  gridItem: {
    flex: 1 / GRID_COLUMNS,
    aspectRatio: 1,
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
});
