import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT, type Region } from "react-native-maps";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../theme";
import { useAuthStore } from "../../stores/auth-store";
import { useSpotsStore } from "../../stores/spots-store";
import type { MainTabNavigationProp } from "../../navigation/types";
import type { Spot } from "../../types";

// Central Paris — a reasonable default when location permission is denied
// or hasn't resolved yet.
const DEFAULT_REGION: Region = {
  latitude: 48.8566,
  longitude: 2.3522,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

export function MapScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation<MainTabNavigationProp<"Map">>();

  const user = useAuthStore((s) => s.user);
  const spots = useSpotsStore((s) => s.spots);
  const feedSpots = useSpotsStore((s) => s.feedSpots);
  const fetchMySpots = useSpotsStore((s) => s.fetchMySpots);
  const fetchFeed = useSpotsStore((s) => s.fetchFeed);

  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (user) {
      void fetchMySpots(user.id);
    }
  }, [user, fetchMySpots]);

  useEffect(() => {
    if (showAll) {
      void fetchFeed();
    }
  }, [showAll, fetchFeed]);

  const locateMe = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;
    const position = await Location.getCurrentPositionAsync({});
    setRegion({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
  };

  useEffect(() => {
    void locateMe();
  }, []);

  const openSpot = (spot: Spot) => {
    navigation.navigate("SpotDetail", { spotId: spot.id });
  };

  const markersToShow = showAll ? feedSpots : spots;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.bg }]} edges={["top"]}>
      {/* Segmented toggle */}
      <View style={{ paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm }}>
        <View
          style={[
            styles.toggleRow,
            {
              backgroundColor: theme.colors.bgSecondary,
              borderRadius: theme.radius.md,
            },
          ]}
        >
          <Pressable
            onPress={() => setShowAll(false)}
            style={[
              styles.toggleButton,
              {
                backgroundColor: !showAll ? theme.colors.text : "transparent",
                borderRadius: theme.radius.sm,
              },
            ]}
          >
            <Text
              style={{
                color: !showAll ? theme.colors.bg : theme.colors.textSecondary,
                fontSize: theme.typography.size.sm,
                fontWeight: theme.typography.weight.medium,
              }}
            >
              {t("map.mySpots")}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setShowAll(true)}
            style={[
              styles.toggleButton,
              {
                backgroundColor: showAll ? theme.colors.text : "transparent",
                borderRadius: theme.radius.sm,
              },
            ]}
          >
            <Text
              style={{
                color: showAll ? theme.colors.bg : theme.colors.textSecondary,
                fontSize: theme.typography.size.sm,
                fontWeight: theme.typography.weight.medium,
              }}
            >
              {t("map.allSpots")}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.mapWrapper}>
        <MapView
          provider={PROVIDER_DEFAULT}
          style={StyleSheet.absoluteFill}
          initialRegion={region}
          region={region}
          onRegionChangeComplete={setRegion}
        >
          {markersToShow.map((spot) => (
            <Marker
              key={spot.id}
              coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
              title={spot.title ?? undefined}
              onPress={() => openSpot(spot)}
            >
              <View
                style={[
                  styles.pin,
                  {
                    backgroundColor: showAll ? theme.colors.sage : theme.colors.accent,
                    borderColor: theme.colors.bg,
                  },
                ]}
              />
            </Marker>
          ))}
        </MapView>

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
          onPress={() => navigation.navigate("Add")}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toggleRow: {
    flexDirection: "row",
    padding: 2,
    alignSelf: "center",
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  mapWrapper: {
    flex: 1,
  },
  pin: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
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
