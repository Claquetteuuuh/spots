import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../theme";
import { useSpotsStore } from "../../stores/spots-store";
import { extractErrorMessage } from "../../lib/error";
import { CompositionBadge } from "../../components/spots/CompositionBadge";
import type { RootStackScreenProps } from "../../navigation/types";
import type { Spot, SpotImage } from "../../types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export function SpotDetailScreen({ route }: RootStackScreenProps<"SpotDetail">) {
  const { spotId } = route.params;
  const { t } = useTranslation();
  const theme = useTheme();
  const fetchSpotById = useSpotsStore((s) => s.fetchSpotById);

  const [spot, setSpot] = useState<Spot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [mapExpanded, setMapExpanded] = useState(false);

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

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setActiveImageIndex(index);
  }, []);

  const renderCarouselItem = useCallback(
    ({ item }: { item: { url: string; key: string } }) => (
      <Image
        source={{ uri: item.url }}
        style={{ width: SCREEN_WIDTH, aspectRatio: 1 }}
        resizeMode="cover"
      />
    ),
    [],
  );

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

  // Build images list: use spot.images if available, otherwise fallback to cover photo
  const images: { url: string; key: string }[] =
    spot.images && spot.images.length > 0
      ? spot.images.map((img) => ({ url: img.photoUrl, key: img.photoKey }))
      : [{ url: spot.photoUrl, key: spot.photoKey }];

  const hasMultipleImages = images.length > 1;

  const locationLabel =
    [spot.city, spot.country].filter(Boolean).join(", ") ||
    spot.address ||
    `${spot.latitude.toFixed(4)}, ${spot.longitude.toFixed(4)}`;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.bg }]} edges={["bottom"]}>
      <ScrollView>
        {/* Photo carousel or single photo */}
        {hasMultipleImages ? (
          <View>
            <FlatList
              data={images}
              renderItem={renderCarouselItem}
              keyExtractor={(item, index) => `${item.key}-${index}`}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleScroll}
              getItemLayout={(_, index) => ({
                length: SCREEN_WIDTH,
                offset: SCREEN_WIDTH * index,
                index,
              })}
            />
            {/* Dots indicator */}
            <View style={styles.dotsContainer}>
              {images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        index === activeImageIndex
                          ? theme.colors.accent
                          : theme.colors.border,
                    },
                  ]}
                />
              ))}
            </View>
            {/* Counter */}
            <View
              style={[
                styles.counterBadge,
                { backgroundColor: "rgba(0,0,0,0.5)", borderRadius: theme.radius.sm },
              ]}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "600" }}>
                {activeImageIndex + 1}/{images.length}
              </Text>
            </View>
          </View>
        ) : (
          <Image source={{ uri: images[0].url }} style={styles.photo} resizeMode="cover" />
        )}

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
              {spot.customComposition ? (
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.size.sm,
                    fontStyle: "italic",
                    marginTop: theme.spacing.xs,
                  }}
                >
                  {spot.customComposition}
                </Text>
              ) : null}
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

          {/* Visibility badge */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.xs }}>
            <Ionicons
              name={spot.visibility === "PRIVATE" ? "lock-closed-outline" : "people-outline"}
              size={14}
              color={spot.visibility === "PRIVATE" ? theme.colors.accent : theme.colors.sage}
            />
            <Text
              style={{
                color: spot.visibility === "PRIVATE" ? theme.colors.accent : theme.colors.sage,
                fontSize: theme.typography.size.sm,
                fontWeight: theme.typography.weight.medium,
                textTransform: "uppercase",
                letterSpacing: 0.4,
              }}
            >
              {spot.visibility === "PRIVATE" ? t("spots.visibilityPrivate") : t("spots.visibilityFollowers")}
            </Text>
          </View>

          {/* Mini map — tap to expand */}
          <Pressable
            onPress={() => setMapExpanded(true)}
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
            {/* Expand hint */}
            <View style={[styles.expandHint, { backgroundColor: theme.colors.bg + "CC" }]}>
              <Ionicons name="expand-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={{ color: theme.colors.textSecondary, fontSize: theme.typography.size.xs, marginLeft: 4 }}>
                {t("map.tapToExpand")}
              </Text>
            </View>
          </Pressable>

          {/* Fullscreen map modal */}
          <Modal visible={mapExpanded} animationType="slide" onRequestClose={() => setMapExpanded(false)}>
            <View style={[styles.fullMapContainer, { backgroundColor: theme.colors.bg }]}>
              <MapView
                provider={PROVIDER_DEFAULT}
                style={StyleSheet.absoluteFill}
                initialRegion={{
                  latitude: spot.latitude,
                  longitude: spot.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                <Marker coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}>
                  <View style={[styles.pin, { backgroundColor: theme.colors.accent, borderColor: theme.colors.bg }]} />
                </Marker>
              </MapView>
              {/* Close button */}
              <Pressable
                onPress={() => setMapExpanded(false)}
                style={[styles.mapCloseButton, { backgroundColor: theme.colors.bg }]}
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </Pressable>
              {/* Coordinates bar */}
              <View style={[styles.mapCoordsBar, { backgroundColor: theme.colors.bg + "EE" }]}>
                <Text style={{ color: theme.colors.textSecondary, fontSize: theme.typography.size.xs, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" }}>
                  {spot.latitude.toFixed(6)}, {spot.longitude.toFixed(6)}
                </Text>
              </View>
            </View>
          </Modal>
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
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  counterBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
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
  expandHint: {
    position: "absolute",
    bottom: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  fullMapContainer: {
    flex: 1,
  },
  mapCloseButton: {
    position: "absolute",
    top: 56,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  mapCoordsBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingBottom: 36,
  },
});
