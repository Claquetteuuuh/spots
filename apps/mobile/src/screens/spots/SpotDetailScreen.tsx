import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../theme";
import { useSpotsStore } from "../../stores/spots-store";
import { extractErrorMessage } from "../../lib/error";
import { CompositionBadge } from "../../components/spots/CompositionBadge";
import type { RootStackScreenProps } from "../../navigation/types";
import type { Spot } from "../../types";

export function SpotDetailScreen({ route }: RootStackScreenProps<"SpotDetail">) {
  const { spotId } = route.params;
  const { t } = useTranslation();
  const theme = useTheme();
  const fetchSpotById = useSpotsStore((s) => s.fetchSpotById);

  const [spot, setSpot] = useState<Spot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetchSpotById(spotId)
      .then((result) => {
        if (!cancelled) setSpot(result);
      })
      .catch((err) => {
        if (!cancelled) setError(extractErrorMessage(err, t("common.error")));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [spotId, fetchSpotById, t]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.colors.bg }]}>
        <ActivityIndicator color={theme.colors.textSecondary} />
      </SafeAreaView>
    );
  }

  if (error || !spot) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.colors.bg }]}>
        <Text style={{ color: theme.colors.error, fontSize: theme.typography.size.base }}>
          {error ?? t("common.error")}
        </Text>
      </SafeAreaView>
    );
  }

  const locationLabel =
    [spot.city, spot.country].filter(Boolean).join(", ") ||
    spot.address ||
    `${spot.latitude.toFixed(4)}, ${spot.longitude.toFixed(4)}`;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.bg }]} edges={["bottom"]}>
      <ScrollView>
        {/* Full-width photo — Instagram post style */}
        <Image source={{ uri: spot.photoUrl }} style={styles.photo} resizeMode="cover" />

        <View style={{ padding: theme.spacing.lg, gap: theme.spacing.lg }}>
          {/* Title + location */}
          <View>
            <Text
              style={{
                color: theme.colors.text,
                fontSize: theme.typography.size.lg,
                fontWeight: theme.typography.weight.bold,
              }}
            >
              {spot.title || t("spots.spotTitle")}
            </Text>
            <Text
              style={{
                color: theme.colors.textSecondary,
                fontSize: theme.typography.size.sm,
                marginTop: theme.spacing.xs,
              }}
            >
              {locationLabel}
            </Text>
          </View>

          {/* Description */}
          {spot.description ? (
            <Text
              style={{
                color: theme.colors.text,
                fontSize: theme.typography.size.base,
                lineHeight: theme.typography.size.base * theme.typography.lineHeight.relaxed,
              }}
            >
              {spot.description}
            </Text>
          ) : null}

          {/* Compositions */}
          {spot.compositions.length > 0 ? (
            <View>
              <SectionLabel text={t("spots.composition")} color={theme.colors.textSecondary} size={theme.typography.size.xs} />
              <View style={[styles.wrapRow, { marginTop: theme.spacing.sm, gap: theme.spacing.sm }]}>
                {spot.compositions.map((composition) => (
                  <CompositionBadge key={composition} type={composition} />
                ))}
              </View>
            </View>
          ) : null}

          {/* Colors */}
          {spot.colors.length > 0 ? (
            <View>
              <SectionLabel text={t("spots.colors")} color={theme.colors.textSecondary} size={theme.typography.size.xs} />
              <View style={[styles.wrapRow, { marginTop: theme.spacing.sm, gap: theme.spacing.sm }]}>
                {spot.colors.map((color, index) => (
                  <View
                    key={`${color}-${index}`}
                    style={[styles.colorDot, { backgroundColor: color, borderColor: theme.colors.border }]}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {/* Tags */}
          {spot.tags.length > 0 ? (
            <View>
              <SectionLabel text={t("spots.tags")} color={theme.colors.textSecondary} size={theme.typography.size.xs} />
              <View style={[styles.wrapRow, { marginTop: theme.spacing.sm, gap: theme.spacing.xs }]}>
                {spot.tags.map((tag) => (
                  <View
                    key={tag}
                    style={[
                      styles.tagChip,
                      {
                        borderColor: theme.colors.border,
                        borderRadius: theme.radius.sm,
                        backgroundColor: theme.colors.bgSecondary,
                      },
                    ]}
                  >
                    <Text style={{ color: theme.colors.textSecondary, fontSize: theme.typography.size.xs }}>
                      #{tag}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Price badge */}
          <Text
            style={{
              color: spot.isFree ? theme.colors.sage : theme.colors.accent,
              fontSize: theme.typography.size.sm,
              fontWeight: theme.typography.weight.medium,
              textTransform: "uppercase",
              letterSpacing: 0.4,
            }}
          >
            {spot.isFree ? t("common.free") : spot.priceInfo || t("common.paid")}
          </Text>

          {/* Mini map */}
          <View
            style={[
              styles.mapThumb,
              { borderColor: theme.colors.border, borderRadius: theme.radius.md },
            ]}
          >
            <MapView
              provider={PROVIDER_DEFAULT}
              style={StyleSheet.absoluteFill}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
              initialRegion={{
                latitude: spot.latitude,
                longitude: spot.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }}
            >
              <Marker coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}>
                <View style={[styles.pin, { backgroundColor: theme.colors.accent, borderColor: theme.colors.bg }]} />
              </Marker>
            </MapView>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionLabel({ text, color, size }: { text: string; color: string; size: number }) {
  return (
    <Text style={{ color, fontSize: size, textTransform: "uppercase", letterSpacing: 0.5 }}>{text}</Text>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  photo: {
    width: "100%",
    aspectRatio: 1,
  },
  wrapRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  colorDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tagChip: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  mapThumb: {
    height: 140,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  pin: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
});
