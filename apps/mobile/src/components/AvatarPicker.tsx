import React, { useCallback, useMemo, useState } from "react";
import {
  Image,
  Modal,
  PixelRatio,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "../theme";
import {
  DICEBEAR_STYLES,
  DICEBEAR_BG_COLORS,
  dicebearUrl,
  dicebearRasterUrl,
} from "@trs/shared/constants";

// ─── Helpers ───────────────────────────────────────────────────────

/** Parse the style and bg hex out of an existing DiceBear URL. */
function parseDicebearUrl(url: string): { style: string; bg: string } | null {
  try {
    const match = url.match(/\/9\.x\/([^/]+)\/svg/);
    if (!match) return null;
    const params = new URLSearchParams(url.split("?")[1] ?? "");
    return {
      style: match[1],
      bg: params.get("backgroundColor") ?? DICEBEAR_BG_COLORS[0],
    };
  } catch {
    return null;
  }
}

/** Deterministic-ish random seed from the current timestamp. */
function randomSeed(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

// ─── Component ─────────────────────────────────────────────────────

interface AvatarPickerProps {
  visible: boolean;
  onClose: () => void;
  /** Called with the chosen DiceBear URL, or `null` to remove the avatar. */
  onSelect: (url: string | null) => void;
  /** Seed for generation — typically the username. */
  seed: string;
  /** Current avatar URL — used to pre-select style/bg when opening. */
  currentUrl?: string | null;
}

const PREVIEW_SIZE = 96;
const STYLE_THUMB_SIZE = 64;

/**
 * Full-screen modal that lets the user pick a DiceBear avatar.
 *
 * 1. Choose a style (thumbnail grid of all styles with the current seed).
 * 2. Choose a background colour (row of circles).
 * 3. Tap "Random" to re-seed, "Remove" to clear.
 * 4. Tap "Save" to confirm.
 *
 * The large preview at the top updates live.
 */
export function AvatarPicker({
  visible,
  onClose,
  onSelect,
  seed: defaultSeed,
  currentUrl,
}: AvatarPickerProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  // Derive initial style/bg from currentUrl when possible
  const parsed = currentUrl ? parseDicebearUrl(currentUrl) : null;

  const [selectedStyle, setSelectedStyle] = useState<string>(
    parsed?.style ?? DICEBEAR_STYLES[0],
  );
  const [selectedBg, setSelectedBg] = useState<string>(
    parsed?.bg ?? DICEBEAR_BG_COLORS[0],
  );
  const [currentSeed, setCurrentSeed] = useState(defaultSeed);

  // Re-sync when the modal opens
  const onShow = useCallback(() => {
    const p = currentUrl ? parseDicebearUrl(currentUrl) : null;
    setSelectedStyle(p?.style ?? DICEBEAR_STYLES[0]);
    setSelectedBg(p?.bg ?? DICEBEAR_BG_COLORS[0]);
    setCurrentSeed(defaultSeed);
  }, [currentUrl, defaultSeed]);

  const previewUrl = useMemo(
    () => dicebearUrl(selectedStyle, currentSeed, selectedBg),
    [selectedStyle, currentSeed, selectedBg],
  );

  // PNG URL for the preview — RN <Image> can't render SVG
  const previewPng = useMemo(
    () => dicebearRasterUrl(previewUrl, PixelRatio.getPixelSizeForLayoutSize(PREVIEW_SIZE)),
    [previewUrl],
  );

  const handleSave = useCallback(() => {
    onSelect(previewUrl);
    onClose();
  }, [previewUrl, onSelect, onClose]);

  const handleRemove = useCallback(() => {
    onSelect(null);
    onClose();
  }, [onSelect, onClose]);

  const handleRandom = useCallback(() => {
    setCurrentSeed(randomSeed());
  }, []);

  // Style thumbnail grid: one PNG per DiceBear style
  const styleThumbs = useMemo(
    () =>
      (DICEBEAR_STYLES as unknown as string[]).map((style) => ({
        style,
        url: dicebearRasterUrl(
          dicebearUrl(style, currentSeed, selectedBg),
          PixelRatio.getPixelSizeForLayoutSize(STYLE_THUMB_SIZE),
        ),
      })),
    [currentSeed, selectedBg],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      onShow={onShow}
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

        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ─ Live preview ─────────────────────────────────── */}
          <View style={styles.previewWrap}>
            <Image
              source={{ uri: previewPng }}
              style={[
                styles.preview,
                { borderColor: theme.colors.border },
              ]}
            />
          </View>

          {/* ─ Random + Remove row ─────────────────────────── */}
          <View style={styles.actionRow}>
            <Pressable
              onPress={handleRandom}
              style={[styles.actionButton, { backgroundColor: theme.colors.bgSecondary }]}
            >
              <Ionicons name="shuffle" size={18} color={theme.colors.accent} />
              <Text style={{ color: theme.colors.accent, fontSize: 14, fontWeight: "600" }}>
                {t("avatar.random")}
              </Text>
            </Pressable>
            {currentUrl ? (
              <Pressable
                onPress={handleRemove}
                style={[styles.actionButton, { backgroundColor: theme.colors.bgSecondary }]}
              >
                <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
                <Text style={{ color: theme.colors.error, fontSize: 14, fontWeight: "600" }}>
                  {t("avatar.removeAvatar")}
                </Text>
              </Pressable>
            ) : null}
          </View>

          {/* ─ Style picker (thumbnail grid) ──────────────── */}
          <Text
            style={[
              styles.sectionLabel,
              { color: theme.colors.textSecondary },
            ]}
          >
            {t("avatar.style")}
          </Text>
          <View style={styles.styleGrid}>
            {styleThumbs.map(({ style, url }) => {
              const active = style === selectedStyle;
              return (
                <Pressable
                  key={style}
                  onPress={() => setSelectedStyle(style)}
                  style={[
                    styles.styleThumb,
                    {
                      borderColor: active ? theme.colors.accent : theme.colors.border,
                      borderWidth: active ? 2.5 : 1,
                      backgroundColor: theme.colors.bgSecondary,
                    },
                  ]}
                >
                  <Image source={{ uri: url }} style={styles.styleThumbImage} />
                  <Text
                    style={{
                      fontSize: 10,
                      color: active ? theme.colors.accent : theme.colors.textSecondary,
                      fontWeight: active ? "700" : "500",
                      textAlign: "center",
                      marginTop: 2,
                    }}
                    numberOfLines={1}
                  >
                    {style}
                  </Text>
                </Pressable>
              );
            })}
          </View>

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
        </ScrollView>
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
  actionRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9999,
  },
  sectionLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  styleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 10,
  },
  styleThumb: {
    width: STYLE_THUMB_SIZE + 16,
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 12,
  },
  styleThumbImage: {
    width: STYLE_THUMB_SIZE,
    height: STYLE_THUMB_SIZE,
    borderRadius: STYLE_THUMB_SIZE / 2,
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
});
