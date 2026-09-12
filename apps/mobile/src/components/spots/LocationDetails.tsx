import React, { useEffect, useState } from "react";
import { Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useTranslation } from "react-i18next";
import { formatCoordinates, navigationLinks } from "@trs/shared/map";
import { useTheme } from "../../theme";

interface LocationDetailsProps {
  latitude: number;
  longitude: number;
  address: string | null;
}

/** How long "Copied" stays up. */
const COPIED_MS = 1500;

/**
 * Where the spot is, in words and in numbers: the address (tap to copy),
 * the coordinates underneath in small type (tap to copy), and a way to
 * open directions in Google Maps, Apple Maps or Waze.
 */
export function LocationDetails({ latitude, longitude, address }: LocationDetailsProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [copied, setCopied] = useState<"address" | "coords" | null>(null);
  const coords = formatCoordinates(latitude, longitude);
  const links = navigationLinks(latitude, longitude);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(null), COPIED_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async (what: "address" | "coords", text: string) => {
    await Clipboard.setStringAsync(text);
    setCopied(what);
  };

  const apps = [
    { key: "google", label: t("common.googleMaps"), url: links.google },
    { key: "apple", label: t("common.appleMaps"), url: links.apple },
    { key: "waze", label: t("common.waze"), url: links.waze },
  ];

  return (
    <View style={styles.root} testID="location-details">
      {address ? (
        <Pressable
          onPress={() => void copy("address", address)}
          accessibilityRole="button"
          accessibilityLabel={t("spots.copyAddress")}
          testID="copy-address"
        >
          <Text style={{ color: theme.colors.text, fontSize: theme.typography.size.base }}>
            {copied === "address" ? t("common.copied") : address}
          </Text>
        </Pressable>
      ) : null}
      <Pressable
        onPress={() => void copy("coords", coords)}
        accessibilityRole="button"
        accessibilityLabel={t("spots.copyCoordinates")}
        testID="copy-coordinates"
      >
        <Text
          style={{
            color: theme.colors.textTertiary,
            fontSize: 11,
            marginTop: 2,
            fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
          }}
        >
          {copied === "coords" ? t("common.copied") : coords}
        </Text>
      </Pressable>

      <View style={styles.apps}>
        <Text style={{ color: theme.colors.textSecondary, fontSize: theme.typography.size.xs }}>
          {t("common.openIn")}
        </Text>
        {apps.map((app) => (
          <Pressable
            key={app.key}
            onPress={() => void Linking.openURL(app.url)}
            accessibilityRole="link"
            style={[styles.chip, { borderColor: theme.colors.border, backgroundColor: theme.colors.bg }]}
            testID={`open-${app.key}`}
          >
            <Text
              style={{
                color: theme.colors.text,
                fontSize: theme.typography.size.sm,
                fontWeight: theme.typography.weight.medium,
              }}
            >
              {app.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 12,
  },
  apps: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  chip: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
  },
});
