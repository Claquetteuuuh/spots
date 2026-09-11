import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dimensions, Image, Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT, type MapPressEvent, type Region } from "react-native-maps";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import {
  EMPTY_FILTERS,
  MAP_PINS_LIMIT,
  SpotClusterer,
  boundsContain,
  clusterMarkerSize,
  countActiveFilters,
  filterPinsByColor,
  filtersToQuery,
  formatClusterCount,
  longitudeDeltaFromZoom,
  padBounds,
  regionToBounds,
  zoomFromLongitudeDelta,
  type LatLng,
  type MapBounds,
  type MapFilters,
  type MapItem,
  type MapPin,
  type MapScope,
} from "@trs/shared/map";
import { useTheme } from "../../theme";
import { useAuthStore } from "../../stores/auth-store";
import { useSpotsStore } from "../../stores/spots-store";
import { useTabSwitch } from "../../navigation/tab-context";
import { MapFiltersSheet } from "../../components/map/MapFiltersSheet";
import type { MainTabNavigationProp } from "../../navigation/types";

// Central Paris — a reasonable default when location permission is denied
// or hasn't resolved yet.
const DEFAULT_REGION: Region = {
  latitude: 48.8566,
  longitude: 2.3522,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

/** Pans settle for this long before the viewport is fetched. */
const FETCH_DEBOUNCE_MS = 300;
const PREVIEW_PHOTO = 72;

/** The last box we fetched: a view inside it, with the same query, needs no request. */
interface FetchedArea {
  bounds: MapBounds;
  scope: MapScope;
  query: string;
  truncated: boolean;
}

export function MapScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation<MainTabNavigationProp<"Map">>();
  const { setTabIndex } = useTabSwitch();

  // The id, not the object: a refreshed session must not refetch the map.
  const userId = useAuthStore((s) => s.user?.id);
  const mapPins = useSpotsStore((s) => s.mapPins);
  const isMapLoading = useSpotsStore((s) => s.isMapLoading);
  const fetchMapPins = useSpotsStore((s) => s.fetchMapPins);

  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [scope, setScope] = useState<MapScope>("all");
  const [filters, setFilters] = useState<MapFilters>(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [position, setPosition] = useState<LatLng | null>(null);
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null);

  const fetchedRef = useRef<FetchedArea | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The server-side filters, keyed so a change reads as a new data set.
  // Colour families are matched here on the pins instead.
  const serverQuery = useMemo(() => filtersToQuery(filters, position), [filters, position]);
  const serverKey = JSON.stringify(serverQuery);
  const serverQueryRef = useRef(serverQuery);
  useEffect(() => {
    serverQueryRef.current = serverQuery;
  }, [serverQuery]);

  /**
   * Fetch pins for a view. Pads the box so small pans stay inside the last
   * fetched area and skip the request — unless that fetch hit the limit,
   * in which case zooming in may reveal pins we never received.
   */
  const loadPins = useCallback(
    (bounds: MapBounds, nextScope: MapScope, force = false) => {
      if (!userId) return;
      const query = serverQueryRef.current;
      const key = JSON.stringify(query);
      const last = fetchedRef.current;
      if (
        !force &&
        last &&
        last.scope === nextScope &&
        last.query === key &&
        !last.truncated &&
        boundsContain(last.bounds, bounds)
      ) {
        return;
      }
      const padded = padBounds(bounds);
      void fetchMapPins({
        bounds: padded,
        scope: nextScope,
        limit: MAP_PINS_LIMIT,
        filters: query,
      }).then((applied) => {
        if (!applied) return;
        fetchedRef.current = {
          bounds: padded,
          scope: nextScope,
          query: key,
          truncated: useSpotsStore.getState().mapTruncated,
        };
      });
    },
    [userId, fetchMapPins],
  );

  // Every settled pan regroups the markers and, after a pause, asks for pins.
  const handleRegionChange = useCallback(
    (next: Region) => {
      setRegion(next);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(
        () => loadPins(regionToBounds(next), scope),
        FETCH_DEBOUNCE_MS,
      );
    },
    [loadPins, scope],
  );

  // First load, a new scope or a new filter set: fetch the current view right away.
  useEffect(() => {
    loadPins(regionToBounds(region), scope, true);
    // `region` is deliberately left out — pans go through the debounce.
  }, [scope, serverKey, loadPins]);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  const locateMe = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;
    const { coords } = await Location.getCurrentPositionAsync({});
    setPosition({ latitude: coords.latitude, longitude: coords.longitude });
    mapRef.current?.animateToRegion(
      {
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      },
      600,
    );
  };

  useEffect(() => {
    void locateMe();
  }, []);

  // Colour families are filtered here; the rest came filtered from the server.
  const visiblePins = useMemo(
    () => filterPinsByColor(mapPins, filters.colors),
    [mapPins, filters.colors],
  );
  const activeFilters = countActiveFilters(filters);
  const nothingMatches = !isMapLoading && activeFilters > 0 && visiblePins.length === 0;

  // Build the cluster index once per pin set (the costly part), then group
  // for the current view — cheap, so it can follow every pan.
  const clusterer = useMemo(
    () => (visiblePins.length > 0 ? new SpotClusterer(visiblePins) : null),
    [visiblePins],
  );
  const items = useMemo<MapItem[]>(() => {
    if (!clusterer) return [];
    const zoom = zoomFromLongitudeDelta(region.longitudeDelta, Dimensions.get("window").width);
    return clusterer.getItems(regionToBounds(region), zoom);
  }, [clusterer, region]);

  // Tapping a cluster zooms just far enough for it to split.
  const zoomToCluster = (item: Extract<MapItem, { kind: "cluster" }>) => {
    if (!clusterer) return;
    const longitudeDelta = longitudeDeltaFromZoom(
      clusterer.getExpansionZoom(item.id) - Math.log2(Dimensions.get("window").width / 256),
    );
    const aspect = region.latitudeDelta / region.longitudeDelta;
    mapRef.current?.animateToRegion(
      {
        latitude: item.latitude,
        longitude: item.longitude,
        longitudeDelta,
        latitudeDelta: longitudeDelta * aspect,
      },
      400,
    );
  };

  const openSpot = (pin: MapPin) => {
    navigation.navigate("SpotDetail", { spotId: pin.id });
  };

  // A tap on the map itself dismisses the preview; a marker tap does not.
  const handleMapPress = (e: MapPressEvent) => {
    if (e.nativeEvent.action === "marker-press") return;
    setSelectedPin(null);
  };

  const scopes: { key: MapScope; label: string }[] = [
    { key: "all", label: t("map.allSpots") },
    { key: "mine", label: t("map.mySpots") },
    { key: "following", label: t("map.followingSpots") },
  ];

  const previewTitle = selectedPin ? (selectedPin.title ?? t("spots.untitled")) : "";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.bg }]} edges={["top"]}>
      {/* Segmented toggle + filters */}
      <View
        style={[
          styles.header,
          { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm },
        ]}
      >
        <View
          style={[
            styles.toggleRow,
            {
              backgroundColor: theme.colors.bgSecondary,
              borderRadius: theme.radius.md,
            },
          ]}
        >
          {scopes.map(({ key, label }) => (
            <Pressable
              key={key}
              onPress={() => setScope(key)}
              accessibilityRole="button"
              accessibilityState={{ selected: scope === key }}
              style={[
                styles.toggleButton,
                {
                  backgroundColor: scope === key ? theme.colors.text : "transparent",
                  borderRadius: theme.radius.sm,
                },
              ]}
            >
              <Text
                style={{
                  color: scope === key ? theme.colors.bg : theme.colors.textSecondary,
                  fontSize: theme.typography.size.sm,
                  fontWeight: theme.typography.weight.medium,
                }}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={() => setFiltersOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={t("map.filters")}
          testID="map-filters-button"
          style={[
            styles.filterButton,
            {
              borderColor: activeFilters > 0 ? theme.colors.accent : theme.colors.border,
              backgroundColor: activeFilters > 0 ? theme.colors.accentTint : theme.colors.bg,
            },
          ]}
        >
          <Ionicons
            name="options-outline"
            size={18}
            color={activeFilters > 0 ? theme.colors.accent : theme.colors.text}
          />
          {activeFilters > 0 ? (
            <View style={[styles.filterBadge, { backgroundColor: theme.colors.accent }]}>
              <Text
                style={{
                  color: theme.colors.onAccent,
                  fontSize: 11,
                  fontWeight: theme.typography.weight.semibold,
                }}
              >
                {activeFilters}
              </Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <View style={styles.mapWrapper}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_DEFAULT}
          style={StyleSheet.absoluteFill}
          initialRegion={DEFAULT_REGION}
          onRegionChangeComplete={handleRegionChange}
          onPress={handleMapPress}
          testID="map-view"
        >
          {items.map((item) => {
            if (item.kind === "cluster") {
              const size = clusterMarkerSize(item.count);
              const fontSize = size >= 52 ? 15 : size >= 42 ? 14 : 13;
              return (
                <Marker
                  key={`cluster-${item.id}`}
                  coordinate={{ latitude: item.latitude, longitude: item.longitude }}
                  anchor={{ x: 0.5, y: 0.5 }}
                  tracksViewChanges={false}
                  onPress={() => zoomToCluster(item)}
                  accessibilityLabel={t("map.spotsInCluster", { count: item.count })}
                  testID={`cluster-${item.id}`}
                >
                  {/* Halo + filled dot: the count sits in the brand blue. */}
                  <View
                    style={[
                      styles.clusterHalo,
                      {
                        width: size + 8,
                        height: size + 8,
                        borderRadius: (size + 8) / 2,
                        backgroundColor: theme.colors.accentTint,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.cluster,
                        {
                          width: size,
                          height: size,
                          borderRadius: size / 2,
                          backgroundColor: theme.colors.accent,
                          borderColor: theme.colors.bg,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: theme.colors.onAccent,
                          fontSize,
                          fontWeight: theme.typography.weight.semibold,
                          fontVariant: ["tabular-nums"],
                        }}
                      >
                        {formatClusterCount(item.count)}
                      </Text>
                    </View>
                  </View>
                </Marker>
              );
            }

            const { pin } = item;
            return (
              <Marker
                key={pin.id}
                coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={false}
                onPress={() => setSelectedPin(pin)}
                accessibilityLabel={pin.title ?? t("spots.untitled")}
                testID={`pin-${pin.id}`}
              >
                {/* Own spots are the full accent, followed ones the lighter tint. */}
                <View
                  testID={`pin-dot-${pin.id}`}
                  style={[
                    styles.pin,
                    {
                      backgroundColor: pin.isOwn ? theme.colors.accent : theme.colors.accentLight,
                      borderColor: theme.colors.bg,
                    },
                  ]}
                />
              </Marker>
            );
          })}

          {/* The open pin's halo is its own marker, so static pins never redraw. */}
          {selectedPin ? (
            <Marker
              key={`halo-${selectedPin.id}`}
              coordinate={{ latitude: selectedPin.latitude, longitude: selectedPin.longitude }}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
              zIndex={-1}
              testID="pin-halo"
            >
              <View style={[styles.pinHalo, { backgroundColor: theme.colors.accentTint }]} />
            </Marker>
          ) : null}
        </MapView>

        {nothingMatches ? (
          <View style={[styles.hint, { backgroundColor: theme.colors.bg }]} pointerEvents="none">
            <Text style={{ color: theme.colors.textSecondary, fontSize: theme.typography.size.xs }}>
              {t("map.noSpotsMatch")}
            </Text>
          </View>
        ) : null}

        {/* Preview card — the photo, the title, the city; tap to open the spot. */}
        {selectedPin ? (
          <Pressable
            onPress={() => openSpot(selectedPin)}
            accessibilityRole="button"
            accessibilityLabel={`${t("map.openSpot")} — ${previewTitle}`}
            testID="spot-preview"
            style={({ pressed }) => [
              styles.preview,
              {
                backgroundColor: theme.colors.bg,
                shadowColor: theme.colors.text,
                opacity: pressed ? 0.92 : 1,
              },
            ]}
          >
            <Image
              source={{ uri: selectedPin.photoUrl }}
              style={[styles.previewPhoto, { backgroundColor: theme.colors.bgTertiary }]}
              accessibilityIgnoresInvertColors
            />
            <View style={styles.previewText}>
              <Text
                numberOfLines={1}
                style={{
                  color: theme.colors.text,
                  fontSize: theme.typography.size.md,
                  fontWeight: theme.typography.weight.semibold,
                }}
              >
                {previewTitle}
              </Text>
              {selectedPin.city ? (
                <Text
                  numberOfLines={1}
                  style={{
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.size.sm,
                    marginTop: 2,
                  }}
                >
                  {selectedPin.city}
                </Text>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
          </Pressable>
        ) : null}

        <Pressable
          onPress={locateMe}
          style={[
            styles.locateButton,
            {
              backgroundColor: theme.colors.bg,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md,
            },
          ]}
          accessibilityLabel={t("map.locateMe")}
        >
          <Text style={{ color: theme.colors.text, fontSize: theme.typography.size.md }}>◎</Text>
        </Pressable>

        <Pressable
          onPress={() => setTabIndex(2)}
          style={[
            styles.fab,
            {
              backgroundColor: theme.colors.accent,
              borderRadius: theme.radius.full,
            },
          ]}
          accessibilityLabel={t("spots.addSpot")}
          testID="map-fab-add-spot"
        >
          <Text
            style={{
              color: theme.colors.onAccent,
              fontSize: theme.typography.size.xl,
              fontWeight: theme.typography.weight.semibold,
              lineHeight: theme.typography.size.xl,
            }}
          >
            +
          </Text>
        </Pressable>
      </View>

      <MapFiltersSheet
        visible={filtersOpen}
        filters={filters}
        onChange={setFilters}
        onClose={() => setFiltersOpen(false)}
        hasPosition={position !== null}
        onRequestPosition={() => void locateMe()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  toggleRow: {
    flexDirection: "row",
    padding: 2,
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  mapWrapper: {
    flex: 1,
  },
  hint: {
    position: "absolute",
    top: 12,
    alignSelf: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  pin: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  pinHalo: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  clusterHalo: {
    alignItems: "center",
    justifyContent: "center",
  },
  cluster: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
  },
  // Sits above the FAB column, clear of both buttons. It genuinely floats
  // over the map, so it carries the one shadow on this screen.
  preview: {
    position: "absolute",
    left: 20,
    right: 84,
    bottom: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 8,
    paddingRight: 12,
    borderRadius: 16,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  previewPhoto: {
    width: PREVIEW_PHOTO,
    height: PREVIEW_PHOTO,
    borderRadius: 12,
  },
  previewText: {
    flex: 1,
    minWidth: 0,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 28,
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  locateButton: {
    position: "absolute",
    right: 20,
    bottom: 92,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
});
