import React, { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../theme";
import { useSpotsStore } from "../../stores/spots-store";
import { SpotCard } from "../../components/spots/SpotCard";
import type { RootStackNavigationProp } from "../../navigation/types";
import type { Spot } from "../../types";

export function FeedScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation<RootStackNavigationProp>();

  const feedSpots = useSpotsStore((s) => s.feedSpots);
  const isLoading = useSpotsStore((s) => s.isLoading);
  const fetchFeed = useSpotsStore((s) => s.fetchFeed);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    void fetchFeed({ reset: true });
  }, [fetchFeed]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFeed({ reset: true });
    setRefreshing(false);
  }, [fetchFeed]);

  const handleOpen = (spot: Spot) => {
    navigation.navigate("SpotDetail", { spotId: spot.id });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.bg }]} edges={["top"]}>
      <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg }}>
        <Text
          style={{
            color: theme.colors.text,
            fontSize: theme.typography.size.xl,
            fontWeight: theme.typography.weight.bold,
          }}
        >
          {t("spots.feed")}
        </Text>
      </View>

      <FlatList
        data={feedSpots}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SpotCard spot={item} onPress={handleOpen} />}
        contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.lg }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.textSecondary}
          />
        }
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (!isLoading) void fetchFeed({ reset: false });
        }}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Text style={{ color: theme.colors.textSecondary, fontSize: theme.typography.size.base }}>
                {t("spots.noSpots")}
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyState: {
    paddingTop: 64,
    alignItems: "center",
  },
});
