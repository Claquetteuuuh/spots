import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../theme";
import type { Spot } from "../../types";
import { CompositionBadge } from "./CompositionBadge";

export interface SpotCardProps {
  spot: Spot;
  onPress?: (spot: Spot) => void;
}

function formatLocation(spot: Spot): string {
  const parts = [spot.city, spot.country].filter(Boolean);
  if (parts.length > 0) return parts.join(", ");
  if (spot.address) return spot.address;
  return `${spot.latitude.toFixed(4)}, ${spot.longitude.toFixed(4)}`;
}

/**
 * Card summarizing a spot: the photo does the talking, everything else
 * is compact metadata underneath — title, location, composition tags,
 * and the palette as a row of small color dots.
 */
export function SpotCard({ spot, onPress }: SpotCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Pressable
      onPress={() => onPress?.(spot)}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
          borderWidth: theme.borderWidth.hairline,
          borderRadius: theme.radius.lg,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
      accessibilityRole="button"
    >
      <Image source={{ uri: spot.photoUrl }} style={styles.image} resizeMode="cover" />

      <View style={{ padding: theme.spacing.md }}>
        <Text
          numberOfLines={1}
          style={{
            color: theme.colors.text,
            fontSize: theme.typography.size.md,
            fontWeight: theme.typography.weight.semibold,
          }}
        >
          {spot.title || t("spots.spotTitle")}
        </Text>

        <Text
          numberOfLines={1}
          style={{
            color: theme.colors.textSecondary,
            fontSize: theme.typography.size.sm,
            marginTop: 2,
          }}
        >
          {formatLocation(spot)}
        </Text>

        {spot.compositions.length > 0 ? (
          <View style={[styles.badgeRow, { marginTop: theme.spacing.sm, gap: theme.spacing.xs }]}>
            {spot.compositions.slice(0, 3).map((composition) => (
              <CompositionBadge key={composition} type={composition} size="sm" />
            ))}
          </View>
        ) : null}

        <View style={styles.footerRow}>
          <View style={[styles.colorRow, { gap: 4 }]}>
            {spot.colors.slice(0, 5).map((color, index) => (
              <View
                key={`${color}-${index}`}
                style={[
                  styles.colorDot,
                  { backgroundColor: color, borderColor: theme.colors.border },
                ]}
              />
            ))}
          </View>

          <Text
            style={{
              color: spot.isFree ? theme.colors.success : theme.colors.textSecondary,
              fontSize: theme.typography.size.xs,
              fontWeight: theme.typography.weight.medium,
              textTransform: "uppercase",
              letterSpacing: 0.4,
            }}
          >
            {spot.isFree ? t("common.free") : t("common.paid")}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  image: {
    width: "100%",
    aspectRatio: 4 / 3,
    backgroundColor: "#00000010",
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  footerRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  colorRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
