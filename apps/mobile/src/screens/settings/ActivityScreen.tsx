import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import type { ActivityKind } from "@trs/shared/validation";
import { useTheme } from "../../theme";
import * as api from "../../lib/api";
import type { ActivityLike, ActivityPhoto } from "../../types";
import type { RootStackNavigationProp } from "../../navigation/types";

const KINDS: ActivityKind[] = ["likes", "photos"];

/**
 * What the viewer has done around spots — the spots they liked and the
 * photos they added — one list at a time, newest first.
 */
export function ActivityScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation<RootStackNavigationProp>();

  const [kind, setKind] = useState<ActivityKind>("likes");
  const [items, setItems] = useState<(ActivityLike | ActivityPhoto)[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (which: ActivityKind, after?: string) => {
    setIsLoading(true);
    try {
      const page = await api.getActivity(which, after);
      setItems((prev) => (after ? [...prev, ...page.items] : page.items));
      setCursor(page.nextCursor);
    } catch {
      // The empty state says enough
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(kind);
  }, [kind, load]);

  const spotLabel = (spot: ActivityLike["spot"]) => spot.title || t("spots.untitled");
  const placeLabel = (spot: ActivityLike["spot"]) => [spot.city, spot.country].filter(Boolean).join(", ");

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      {/* Two pills, one list */}
      <View style={styles.tabs} accessibilityRole="tablist">
        {KINDS.map((k) => {
          const selected = kind === k;
          return (
            <Pressable
              key={k}
              onPress={() => setKind(k)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              style={[
                styles.tab,
                {
                  borderColor: selected ? theme.colors.accent : theme.colors.border,
                  backgroundColor: selected ? theme.colors.accentTint : theme.colors.bg,
                },
              ]}
              testID={`activity-tab-${k}`}
            >
              <Text
                style={{
                  color: selected ? theme.colors.accent : theme.colors.textSecondary,
                  fontSize: theme.typography.size.sm,
                  fontWeight: theme.typography.weight.medium,
                }}
              >
                {k === "likes" ? t("settings.activityLikes") : t("settings.activityPhotos")}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        onEndReached={() => {
          if (cursor && !isLoading) void load(kind, cursor);
        }}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load(kind).finally(() => setRefreshing(false));
            }}
            tintColor={theme.colors.textSecondary}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator style={styles.empty} color={theme.colors.textSecondary} />
          ) : (
            <Text style={[styles.empty, { color: theme.colors.textSecondary, fontSize: theme.typography.size.base }]}>
              {kind === "likes" ? t("settings.activityEmptyLikes") : t("settings.activityEmptyPhotos")}
            </Text>
          )
        }
        renderItem={({ item }) => {
          const photo = "photoUrl" in item ? item : null;
          return (
            <Pressable
              onPress={() => navigation.navigate("SpotDetail", { spotId: item.spot.id })}
              style={[styles.row, { borderBottomColor: theme.colors.border }]}
              testID={`activity-${item.id}`}
            >
              <Image
                source={{ uri: photo ? photo.photoUrl : item.spot.photoUrl }}
                style={{ width: 56, height: 56, borderRadius: theme.radius.md }}
                accessibilityIgnoresInvertColors
              />
              <View style={styles.rowText}>
                {photo ? (
                  <>
                    <Text numberOfLines={1} style={{ color: theme.colors.text, fontSize: theme.typography.size.base }}>
                      {photo.caption || spotLabel(item.spot)}
                    </Text>
                    <Text numberOfLines={1} style={{ color: theme.colors.textSecondary, fontSize: theme.typography.size.xs }}>
                      {t("settings.activityOn")} {spotLabel(item.spot)} · @{item.spot.user.username}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text
                      numberOfLines={1}
                      style={{
                        color: theme.colors.text,
                        fontSize: theme.typography.size.base,
                        fontWeight: theme.typography.weight.semibold,
                      }}
                    >
                      {spotLabel(item.spot)}
                    </Text>
                    <Text numberOfLines={1} style={{ color: theme.colors.textSecondary, fontSize: theme.typography.size.xs }}>
                      {[placeLabel(item.spot), `@${item.spot.user.username}`].filter(Boolean).join(" · ")}
                    </Text>
                  </>
                )}
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabs: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tab: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  empty: {
    paddingVertical: 64,
    textAlign: "center",
  },
});
