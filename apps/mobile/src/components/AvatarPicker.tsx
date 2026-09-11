import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "../theme";

// ─── DiceBear configuration ────────────────────────────────────────
// These match the shared constants the web fork defines. Once both
// forks are merged the import can switch to `@trs/shared/constants`.

const DICEBEAR_STYLES = [
  "avataaars",
  "bottts",
  "fun-emoji",
  "lorelei",
  "notionists",
  "open-peeps",
  "personas",
  "pixel-art",
  "thumbs",
] as const;

const DICEBEAR_BG_COLORS = [
  "b6e3f4",
  "c0aede",
  "d1d4f9",
  "ffd5dc",
  "ffdfbf",
] as const;

function dicebearUrl(
  style: string,
  seed: string,
  bgColor: string,
): string {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${bgColor}`;
}

// ─── Component ─────────────────────────────────────────────────────

interface AvatarPickerProps {
  visible: boolean;
  onClose: () => void;
  /** Called with the chosen DiceBear URL when the user confirms. */
  onSelect: (url: string) => void;
  /** Seed for generation — typically the username. */
  seed: string;
}

const PREVIEW_SIZE = 80;
const GRID_ITEM_SIZE = 72;
const STYLE_PILL_HEIGHT = 36;

/**
 * Full-screen modal that lets the user pick a DiceBear avatar.
 *
 * 1. Choose a style (horizontal scroll of pills).
 * 2. Choose a background colour (row of circles).
 * 3. Tap "Save" to confirm.
 *
 * The large preview at the top updates live.
 */
export function AvatarPicker({ visible, onClose, onSelect, seed }: AvatarPickerProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  const [selectedStyle, setSelectedStyle] = useState<string>(DICEBEAR_STYLES[0]);
  const [selectedBg, setSelectedBg] = useState<string>(DICEBEAR_BG_COLORS[0]);

  const previewUrl = useMemo(
    () => dicebearUrl(selectedStyle, seed, selectedBg),
    [selectedStyle, seed, selectedBg],
  );

  const handleSave = useCallback(() => {
    onSelect(previewUrl);
    onClose();
  }, [previewUrl, onSelect, onClose]);

  // Grid of all style × bg combinations for current style
  const gridItems = useMemo(
    () =>
      DICEBEAR_BG_COLORS.map((bg) => ({
        bg,
        url: dicebearUrl(selectedStyle, seed, bg),
      })),
    [selectedStyle, seed],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
        {/* ─ Header ───────────────────────────────────────── */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <Pressable onPress={onClose} style={styles.headerButton}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </Pressable>
          <Text
            style={{
              flex: 1,
              textAlign: "center",
              color: theme.colors.text,
              fontSize: theme.typography.size.base,
              fontWeight: theme.typography.weight.semibold,
            }}
          >
            {t("avatar.pickTitle")}
          </Text>
          <Pressable onPress={handleSave} style={styles.headerButton}>
            <Text
              style={{
                color: theme.colors.accent,
                fontSize: theme.typography.size.base,
                fontWeight: theme.typography.weight.semibold,
              }}
            >
              {t("common.save")}
            </Text>
          </Pressable>
        </View>

        {/* ─ Live preview ─────────────────────────────────── */}
        <View style={styles.previewWrap}>
          <Image
            source={{ uri: previewUrl }}
            style={[
              styles.preview,
              { borderColor: theme.colors.border },
            ]}
          />
        </View>

        {/* ─ Style picker (horizontal pills) ──────────────── */}
        <Text
          style={[
            styles.sectionLabel,
            { color: theme.colors.textSecondary },
          ]}
        >
          {t("avatar.style")}
        </Text>
        <FlatList
          data={DICEBEAR_STYLES as unknown as string[]}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.pillRow}
          renderItem={({ item }) => {
            const active = item === selectedStyle;
            return (
              <Pressable
                onPress={() => setSelectedStyle(item)}
                style={[
                  styles.pill,
                  {
                    backgroundColor: active
                      ? theme.colors.accent
                      : theme.colors.bgSecondary,
                    borderColor: active
                      ? theme.colors.accent
                      : theme.colors.border,
                  },
                ]}
              >
                <Text
                  style={{
                    color: active ? theme.colors.onAccent : theme.colors.text,
                    fontSize: theme.typography.size.sm,
                    fontWeight: theme.typography.weight.semibold,
                  }}
                >
                  {item}
                </Text>
              </Pressable>
            );
          }}
        />

        {/* ─ Background colour picker ─────────────────────── */}
        <Text
          style={[
            styles.sectionLabel,
            { color: theme.colors.textSecondary },
          ]}
        >
          {t("avatar.bgColor")}
        </Text>
        <View style={styles.colorRow}>
          {DICEBEAR_BG_COLORS.map((bg) => {
            const active = bg === selectedBg;
            return (
              <Pressable
                key={bg}
                onPress={() => setSelectedBg(bg)}
                style={[
                  styles.colorCircle,
                  { backgroundColor: `#${bg}` },
                  active && {
                    borderWidth: 3,
                    borderColor: theme.colors.accent,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* ─ Preview grid (all bg variants for current style) */}
        <Text
          style={[
            styles.sectionLabel,
            { color: theme.colors.textSecondary },
          ]}
        >
          {t("avatar.preview")}
        </Text>
        <View style={styles.gridRow}>
          {gridItems.map(({ bg, url }) => {
            const active = bg === selectedBg;
            return (
              <Pressable
                key={bg}
                onPress={() => setSelectedBg(bg)}
                style={[
                  styles.gridItem,
                  active && {
                    borderWidth: 2,
                    borderColor: theme.colors.accent,
                    borderRadius: GRID_ITEM_SIZE / 2,
                  },
                ]}
              >
                <Image
                  source={{ uri: url }}
                  style={styles.gridImage}
                />
              </Pressable>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerButton: {
    width: 60,
    alignItems: "center",
  },
  previewWrap: {
    alignItems: "center",
    paddingVertical: 24,
  },
  preview: {
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
    borderRadius: PREVIEW_SIZE / 2,
    borderWidth: 2,
  },
  sectionLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  pillRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    height: STYLE_PILL_HEIGHT,
    paddingHorizontal: 16,
    borderRadius: STYLE_PILL_HEIGHT / 2,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  colorRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  gridRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 12,
    paddingTop: 4,
    paddingBottom: 24,
  },
  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    padding: 2,
  },
  gridImage: {
    width: "100%",
    height: "100%",
    borderRadius: (GRID_ITEM_SIZE - 4) / 2,
  },
});
