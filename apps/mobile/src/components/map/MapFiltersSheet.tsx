import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import {
  COLOR_FAMILIES,
  COMPOSITION_TYPES,
  PROXIMITY_RADII_KM,
  SPOT_ACCESSIBILITY,
} from "@trs/shared/constants";
import { EMPTY_FILTERS, countActiveFilters, type MapFilters } from "@trs/shared/map";
import { useTheme } from "../../theme";
import { CompositionIcon } from "../spots/CompositionIcon";

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
  const active = countActiveFilters(filters);

  const pickRadius = (radiusKm: number | null) => {
    onChange({ ...filters, radiusKm });
    if (radiusKm && !hasPosition) onRequestPosition();
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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* Tap the dimmed map to close */}
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={t("map.filtersDone")} />
      <View style={[styles.sheet, { backgroundColor: theme.colors.bg }]} testID="map-filters-sheet">
        <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />

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

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {section(
            t("map.filterColors"),
            <View style={styles.row}>
              {COLOR_FAMILIES.map(({ key, swatch }) => {
                const selected = filters.colors.includes(key);
                return (
                  <Pressable
                    key={key}
                    onPress={() => onChange({ ...filters, colors: toggle(filters.colors, key) })}
                    accessibilityRole="button"
                    accessibilityLabel={t(`colorFamilies.${key}`)}
                    accessibilityState={{ selected }}
                    style={[
                      styles.swatchRing,
                      { borderColor: selected ? theme.colors.accent : "transparent" },
                    ]}
                  >
                    <View
                      style={[
                        styles.swatch,
                        { backgroundColor: swatch, borderColor: theme.colors.border },
                      ]}
                    />
                  </Pressable>
                );
              })}
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
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(22, 32, 58, 0.35)",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 28,
    maxHeight: "82%",
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    marginTop: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 14,
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
  done: {
    marginHorizontal: 20,
    marginTop: 8,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});
