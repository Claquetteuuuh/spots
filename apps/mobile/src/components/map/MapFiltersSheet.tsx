import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import {
  FILTER_PALETTE,
  COMPOSITION_TYPES,
  PROXIMITY_RADII_KM,
  SPOT_ACCESSIBILITY,
} from "@trs/shared/constants";
import { EMPTY_FILTERS, countActiveFilters, type MapFilters } from "@trs/shared/map";
import { useTheme } from "../../theme";
import { CompositionIcon } from "../spots/CompositionIcon";
import { Drawer } from "../ui/Drawer";
import { ColorWheelSheet } from "../spots/ColorWheelSheet";

interface MapFiltersSheetProps {
  visible: boolean;
  filters: MapFilters;
  onChange: (filters: MapFilters) => void;
  onClose: () => void;
  /** Whether "around me" can be honoured right now. */
  hasPosition: boolean;
  /** A radius was picked without a position — go and get one. */
  onRequestPosition: () => void;
}

const PALETTE_HEXES = new Set<string>(FILTER_PALETTE.map((c) => c.hex));
/** The wheel button: six hues around a circle, the one place a spectrum belongs. */
const WHEEL_DOTS = ["#E53935", "#FDD835", "#43A047", "#00ACC1", "#1E88E5", "#8E24AA"].map((color, i) => {
  const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
  return { color, x: 13 + 9 * Math.cos(angle), y: 13 + 9 * Math.sin(angle) };
});

function toggle<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/**
 * The map's filter sheet: colours, compositions, accessibility and an
 * "around me" radius. Every change applies at once; closing just hides it.
 */
export function MapFiltersSheet({
  visible,
  filters,
  onChange,
  onClose,
  hasPosition,
  onRequestPosition,
}: MapFiltersSheetProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const active = countActiveFilters(filters);

  const pickRadius = (radiusKm: number | null) => {
    onChange({ ...filters, radiusKm });
    if (radiusKm && !hasPosition) onRequestPosition();
  };

  const [wheelOpen, setWheelOpen] = useState(false);
  // Anything chosen that is not a palette swatch came from the wheel
  const customColors = filters.colors.filter((hex) => !PALETTE_HEXES.has(hex));

  const addColor = (raw: string) => {
    const hex = raw.trim().toUpperCase();
    if (!/^#[0-9A-F]{6}$/.test(hex) || filters.colors.includes(hex)) return;
    onChange({ ...filters, colors: [...filters.colors, hex] });
  };

  const swatch = (hex: string, label: string) => {
    const selected = filters.colors.includes(hex);
    return (
      <Pressable
        key={hex}
        onPress={() => onChange({ ...filters, colors: toggle(filters.colors, hex) })}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected }}
        style={[styles.swatchRing, { borderColor: selected ? theme.colors.accent : "transparent" }]}
      >
        <View style={[styles.swatch, { backgroundColor: hex, borderColor: theme.colors.border }]} />
      </Pressable>
    );
  };

  const chip = (
    selected: boolean,
    label: string,
    onPress: () => void,
    key: string,
    icon?: React.ReactNode,
  ) => (
    <Pressable
      key={key}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[
        styles.chip,
        {
          borderColor: selected ? theme.colors.accent : theme.colors.border,
          backgroundColor: selected ? theme.colors.accentTint : theme.colors.bg,
        },
      ]}
    >
      {icon}
      <Text
        style={{
          color: selected ? theme.colors.accent : theme.colors.textSecondary,
          fontSize: theme.typography.size.sm,
          fontWeight: theme.typography.weight.medium,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );

  const section = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text
        style={[
          styles.sectionTitle,
          { color: theme.colors.textSecondary, fontSize: theme.typography.size.xs },
        ]}
      >
        {title}
      </Text>
      {children}
    </View>
  );

  return (
    <Drawer visible={visible} onClose={onClose}>
        <View
          style={[
            styles.body,
            // Never taller than the screen: the list scrolls, the button stays put
            {
              maxHeight: height * 0.85,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
          testID="map-filters-sheet"
        >
        <View style={styles.header}>
          <Text
            style={{
              color: theme.colors.text,
              fontSize: theme.typography.size.lg,
              fontWeight: theme.typography.weight.semibold,
            }}
          >
            {t("map.filters")}
          </Text>
          <Pressable
            onPress={() => onChange(EMPTY_FILTERS)}
            disabled={active === 0}
            accessibilityRole="button"
            style={{ opacity: active === 0 ? 0.4 : 1 }}
          >
            <Text
              style={{
                color: theme.colors.textSecondary,
                fontSize: theme.typography.size.sm,
                fontWeight: theme.typography.weight.medium,
              }}
            >
              {t("map.filtersReset")}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          testID="map-filters-scroll"
        >
          {section(
            t("map.filterColors"),
            <View style={styles.row}>
              {FILTER_PALETTE.map(({ key, hex }) => swatch(hex, t(`colorFamilies.${key}`)))}
              {/* Colours picked on the wheel sit after the palette */}
              {customColors.map((hex) => swatch(hex, hex))}
              <Pressable
                onPress={() => setWheelOpen(true)}
                accessibilityRole="button"
                accessibilityLabel={t("spots.pickColor")}
                style={[styles.swatchRing, { borderColor: "transparent" }]}
                testID="map-filters-color-wheel"
              >
                <View style={[styles.swatch, styles.wheel, { borderColor: theme.colors.border }]}>
                  {WHEEL_DOTS.map(({ color, x, y }) => (
                    <View key={color} style={[styles.wheelDot, { backgroundColor: color, left: x, top: y }]} />
                  ))}
                </View>
              </Pressable>
            </View>,
          )}

          {section(
            t("map.filterCompositions"),
            <View style={styles.row}>
              {COMPOSITION_TYPES.map((comp) => {
                const selected = filters.compositions.includes(comp);
                return chip(
                  selected,
                  t(`compositions.${comp}`),
                  () => onChange({ ...filters, compositions: toggle(filters.compositions, comp) }),
                  comp,
                  <CompositionIcon
                    type={comp}
                    size={16}
                    color={selected ? theme.colors.accent : theme.colors.textSecondary}
                  />,
                );
              })}
            </View>,
          )}

          {section(
            t("map.filterAccessibility"),
            <View style={styles.row}>
              {SPOT_ACCESSIBILITY.map((level) =>
                chip(
                  filters.accessibility.includes(level),
                  t(`spots.accessibilityLevel.${level}`),
                  () => onChange({ ...filters, accessibility: toggle(filters.accessibility, level) }),
                  level,
                ),
              )}
            </View>,
          )}

          {section(
            t("map.filterProximity"),
            <>
              <View style={styles.row}>
                {chip(filters.radiusKm === null, t("map.anywhere"), () => pickRadius(null), "any")}
                {PROXIMITY_RADII_KM.map((km) =>
                  chip(
                    filters.radiusKm === km,
                    t("map.withinKm", { km }),
                    () => pickRadius(km),
                    String(km),
                  ),
                )}
              </View>
              {filters.radiusKm && !hasPosition ? (
                <Text
                  style={{
                    marginTop: theme.spacing.sm,
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.size.xs,
                  }}
                >
                  {t("map.needLocation")}
                </Text>
              ) : null}
            </>,
          )}
        </ScrollView>

        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          style={[styles.done, { backgroundColor: theme.colors.text }]}
          testID="map-filters-done"
        >
          <Text
            style={{
              color: theme.colors.bg,
              fontSize: theme.typography.size.md,
              fontWeight: theme.typography.weight.semibold,
            }}
          >
            {t("map.filtersDone")}
          </Text>
        </Pressable>
        </View>

      <ColorWheelSheet
        visible={wheelOpen}
        onClose={() => setWheelOpen(false)}
        onPick={(hex) => {
          addColor(hex);
          setWheelOpen(false);
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  body: {
    flexShrink: 1,
  },
  // Gives way inside the sheet's max height instead of pushing the button off screen
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 6,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  section: {
    marginTop: 14,
  },
  sectionTitle: {
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  swatchRing: {
    padding: 2,
    borderRadius: 22,
    borderWidth: 2,
  },
  swatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
  },
  wheel: {
    backgroundColor: "transparent",
  },
  wheelDot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  done: {
    marginHorizontal: 20,
    marginTop: 8,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});
