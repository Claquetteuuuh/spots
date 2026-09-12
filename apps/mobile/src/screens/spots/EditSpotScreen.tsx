import React, { useCallback, useEffect, useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { COMPOSITION_TYPES, type CompositionType, type SpotAccessibility } from "@trs/shared/constants";
import { useTheme } from "../../theme";
import { invalidateMapCache, useSpotsStore } from "../../stores/spots-store";
import { extractErrorMessage } from "../../lib/error";
import * as api from "../../lib/api";
import { confirmDialog, noticeDialog } from "../../stores/dialog-store";
import { CompositionBadge } from "../../components/spots/CompositionBadge";
import { AccessibilityPicker } from "../../components/spots/AccessibilityPicker";
import type { RootStackScreenProps } from "../../navigation/types";
import type { Spot, SpotImage } from "../../types";

/** A spot's gallery holds this many photos at most. */
const MAX_SPOT_IMAGES = 10;

const MAX_COMPOSITIONS = 5;
const MAX_COLORS = 10;

const PRESET_COLORS = [
  "#FAFAF8", "#F5E6D3",
  "#D4A574", "#B49A7A", "#8B7355", "#6B5740",
  "#7D8C6E", "#5B6850", "#2E4A3E",
  "#4A6FA5", "#4A90A4", "#2C5F7C",
  "#C44536", "#9B2335",
  "#D4A017", "#C8B560",
  "#6B5B8D", "#8E6F8E",
  "#6B6960", "#3D3D3D", "#1A1A18",
];

function SectionLabel({ text, color, size }: { text: string; color: string; size: number }) {
  return (
    <Text style={{ color, fontSize: size, textTransform: "uppercase", letterSpacing: 0.5 }}>
      {text}
    </Text>
  );
}

export function EditSpotScreen({ route, navigation }: RootStackScreenProps<"EditSpot">) {
  const { spotId } = route.params;
  const { t } = useTranslation();
  const theme = useTheme();
  const fetchSpotById = useSpotsStore((s) => s.fetchSpotById);
  const updateSpot = useSpotsStore((s) => s.updateSpot);

  const [spot, setSpot] = useState<Spot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Editable fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCompositions, setSelectedCompositions] = useState<string[]>([]);
  const [customComposition, setCustomComposition] = useState("");
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [accessibility, setAccessibility] = useState<SpotAccessibility | null>(null);
  // The gallery: added to or trimmed right away, independently of Save
  const [images, setImages] = useState<SpotImage[]>([]);
  const [photoBusy, setPhotoBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetchSpotById(spotId)
      .then((result) => {
        if (cancelled) return;
        setSpot(result);
        setTitle(result.title ?? "");
        setDescription(result.description ?? "");
        setSelectedCompositions(result.compositions ?? []);
        setCustomComposition(result.customComposition ?? "");
        setSelectedColors(result.colors ?? []);
        setAccessibility(result.accessibility ?? null);
        setImages(result.images ?? []);
      })
      .catch((err) => {
        if (!cancelled) {
          void noticeDialog({ title: t("common.error"), message: extractErrorMessage(err, t("common.error")) });
          navigation.goBack();
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [spotId, fetchSpotById, t, navigation]);

  const pickAndAddImage = async () => {
    if (!spot) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    const asset = result.canceled ? null : result.assets[0];
    if (!asset) return;
    setPhotoBusy(true);
    try {
      setImages(await api.addSpotImage(spot.id, asset.uri, asset.fileName ?? `photo-${Date.now()}.jpg`));
      invalidateMapCache();
    } catch (err) {
      void noticeDialog({ title: t("common.error"), message: extractErrorMessage(err, t("common.error")) });
    } finally {
      setPhotoBusy(false);
    }
  };

  const removeImage = async (image: SpotImage) => {
    if (!spot) return;
    if (images.length <= 1) {
      void noticeDialog({ title: t("spots.lastPhoto") });
      return;
    }
    const sure = await confirmDialog({
      title: t("spots.removePhoto"),
      message: t("spots.removePhotoMessage"),
      confirmLabel: t("common.delete"),
      destructive: true,
    });
    if (!sure) return;
    setPhotoBusy(true);
    try {
      const result = await api.removeSpotImage(spot.id, image.id);
      setImages(result.images);
      // The cover went with it: the spot now wears the next photo
      if (result.cover) setSpot((prev) => (prev ? { ...prev, ...result.cover } : prev));
      invalidateMapCache();
    } catch (err) {
      void noticeDialog({ title: t("common.error"), message: extractErrorMessage(err, t("common.error")) });
    } finally {
      setPhotoBusy(false);
    }
  };

  const handleSave = useCallback(async () => {
    if (!spot) return;
    setIsSaving(true);
    try {
      await updateSpot(spot.id, {
        title: title || undefined,
        description: description || undefined,
        compositions: selectedCompositions as CompositionType[],
        customComposition: selectedCompositions.includes("OTHER") ? (customComposition || undefined) : undefined,
        colors: selectedColors,
        accessibility,
      });
      void noticeDialog({ title: t("spots.editSuccess") });
      navigation.goBack();
    } catch (err) {
      void noticeDialog({
        title: t("common.error"),
        message: extractErrorMessage(err, t("spots.errors.updateFailed")),
      });
    } finally {
      setIsSaving(false);
    }
  }, [spot, title, description, selectedCompositions, customComposition, selectedColors, accessibility, updateSpot, navigation, t]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={handleSave}
          disabled={isSaving}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t("common.save")}
          testID="save-spot"
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={theme.colors.accent} />
          ) : (
            <Text style={{ color: theme.colors.accent, fontSize: theme.typography.size.base, fontWeight: theme.typography.weight.semibold }}>
              {t("common.save")}
            </Text>
          )}
        </Pressable>
      ),
    });
  }, [navigation, handleSave, isSaving, t, theme]);

  function toggleComposition(comp: string) {
    setSelectedCompositions((prev) =>
      prev.includes(comp)
        ? prev.filter((c) => c !== comp)
        : prev.length < MAX_COMPOSITIONS
          ? [...prev, comp]
          : prev,
    );
  }

  function toggleColor(color: string) {
    setSelectedColors((prev) =>
      prev.includes(color)
        ? prev.filter((c) => c !== color)
        : prev.length < MAX_COLORS
          ? [...prev, color]
          : prev,
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.colors.bg }]}>
        <ActivityIndicator color={theme.colors.textSecondary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.bg }]} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.lg }}>
          {/* Title */}
          <View style={{ gap: theme.spacing.xs }}>
            <SectionLabel text={t("spots.spotTitle")} color={theme.colors.textSecondary} size={theme.typography.size.xs} />
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={t("spots.spotTitlePlaceholder")}
              placeholderTextColor={theme.colors.textTertiary}
              maxLength={200}
              style={[
                styles.input,
                {
                  borderColor: theme.colors.border,
                  borderRadius: theme.radius.sm,
                  backgroundColor: theme.colors.bgSecondary,
                  color: theme.colors.text,
                  fontSize: theme.typography.size.base,
                },
              ]}
              testID="edit-spot-title"
            />
            <Text style={{ color: theme.colors.textTertiary, fontSize: theme.typography.size.xs, textAlign: "right" }}>
              {title.length}/200
            </Text>
          </View>

          {/* Description */}
          <View style={{ gap: theme.spacing.xs }}>
            <SectionLabel text={t("spots.description")} color={theme.colors.textSecondary} size={theme.typography.size.xs} />
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder={t("spots.descriptionPlaceholder")}
              placeholderTextColor={theme.colors.textTertiary}
              maxLength={2000}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={[
                styles.input,
                styles.multiline,
                {
                  borderColor: theme.colors.border,
                  borderRadius: theme.radius.sm,
                  backgroundColor: theme.colors.bgSecondary,
                  color: theme.colors.text,
                  fontSize: theme.typography.size.base,
                },
              ]}
              testID="edit-spot-description"
            />
            <Text style={{ color: theme.colors.textTertiary, fontSize: theme.typography.size.xs, textAlign: "right" }}>
              {description.length}/2000
            </Text>
          </View>

          {/* Compositions */}
          <View style={{ gap: theme.spacing.sm }}>
            <SectionLabel text={t("spots.composition")} color={theme.colors.textSecondary} size={theme.typography.size.xs} />
            <Text style={{ color: theme.colors.textTertiary, fontSize: theme.typography.size.xs }}>
              {selectedCompositions.length}/{MAX_COMPOSITIONS}
            </Text>
            <View style={styles.compositionGrid}>
              {COMPOSITION_TYPES.map((comp) => {
                const selected = selectedCompositions.includes(comp);
                return (
                  <Pressable
                    key={comp}
                    onPress={() => toggleComposition(comp)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={[
                      styles.compositionCell,
                      {
                        borderColor: selected ? theme.colors.accent : theme.colors.border,
                        borderWidth: selected ? 2 : StyleSheet.hairlineWidth,
                        borderRadius: theme.radius.md,
                        backgroundColor: selected ? theme.colors.bgSecondary : theme.colors.bg,
                      },
                    ]}
                    testID={`composition-${comp}`}
                  >
                    <CompositionBadge type={comp} />
                  </Pressable>
                );
              })}
            </View>

            {selectedCompositions.includes("OTHER") ? (
              <TextInput
                value={customComposition}
                onChangeText={setCustomComposition}
                placeholder={t("spots.customCompositionPlaceholder")}
                placeholderTextColor={theme.colors.textTertiary}
                maxLength={100}
                style={[
                  styles.input,
                  {
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.sm,
                    backgroundColor: theme.colors.bgSecondary,
                    color: theme.colors.text,
                    fontSize: theme.typography.size.base,
                  },
                ]}
              />
            ) : null}
          </View>

          {/* Colors */}
          <View style={{ gap: theme.spacing.sm }}>
            <SectionLabel text={t("spots.accessibilityTitle")} color={theme.colors.textSecondary} size={theme.typography.size.xs} />
            <AccessibilityPicker value={accessibility} onChange={setAccessibility} />
            <View style={{ height: theme.spacing.lg }} />

            <SectionLabel text={t("spots.colors")} color={theme.colors.textSecondary} size={theme.typography.size.xs} />
            <Text style={{ color: theme.colors.textTertiary, fontSize: theme.typography.size.xs }}>
              {selectedColors.length}/{MAX_COLORS}
            </Text>

            {/* Preset swatches */}
            <View style={styles.colorGrid}>
              {PRESET_COLORS.map((color) => {
                const selected = selectedColors.includes(color);
                return (
                  <Pressable
                    key={color}
                    onPress={() => toggleColor(color)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={color}
                    testID={`color-${color}`}
                    style={[
                      styles.colorSwatch,
                      {
                        backgroundColor: color,
                        borderColor: selected ? theme.colors.text : theme.colors.border,
                        borderWidth: selected ? 2 : StyleSheet.hairlineWidth,
                      },
                    ]}
                  />
                );
              })}
            </View>

            {/* Selected colors */}
            {selectedColors.length > 0 ? (
              <View>
                <Text style={{ color: theme.colors.textSecondary, fontSize: theme.typography.size.xs, marginBottom: theme.spacing.xs }}>
                  {t("spots.selectedColors")}
                </Text>
                <View style={styles.selectedColorRow}>
                  {selectedColors.map((color) => (
                    <Pressable
                      key={color}
                      onPress={() => toggleColor(color)}
                      accessibilityLabel={`${t("common.delete")} ${color}`}
                      style={styles.selectedColorItem}
                    >
                      <View
                        style={[
                          styles.colorDot,
                          { backgroundColor: color, borderColor: theme.colors.border },
                        ]}
                      />
                      <View style={[styles.removeColorBadge, { backgroundColor: theme.colors.text }]}>
                        <Ionicons name="close" size={10} color={theme.colors.bg} />
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}
          </View>

          {/* Photos — added or removed right away, independently of Save */}
          <View>
            <SectionLabel
              text={`${t("spots.photos")} (${images.length}/${MAX_SPOT_IMAGES})`}
              color={theme.colors.textSecondary}
              size={theme.typography.size.xs}
            />
            <Text style={{ color: theme.colors.textTertiary, fontSize: theme.typography.size.xs, marginTop: 2 }}>
              {t("spots.photoLimit")}
            </Text>
            <View style={[styles.selectedColorRow, { marginTop: theme.spacing.sm, gap: 12 }]}>
              {images.map((image, i) => (
                <View key={image.id} style={styles.selectedColorItem}>
                  <Image source={{ uri: image.photoUrl }} style={styles.thumb} accessibilityIgnoresInvertColors />
                  {i === 0 ? (
                    <View style={styles.coverTag}>
                      <Text style={styles.coverText}>{t("spots.cover")}</Text>
                    </View>
                  ) : null}
                  <Pressable
                    onPress={() => void removeImage(image)}
                    disabled={photoBusy || images.length <= 1}
                    accessibilityRole="button"
                    accessibilityLabel={`${t("common.delete")} ${i + 1}`}
                    style={[
                      styles.removeColorBadge,
                      { backgroundColor: theme.colors.text, opacity: images.length <= 1 ? 0.4 : 1 },
                    ]}
                    testID={`remove-image-${image.id}`}
                  >
                    <Ionicons name="close" size={10} color={theme.colors.bg} />
                  </Pressable>
                </View>
              ))}
              {images.length < MAX_SPOT_IMAGES ? (
                <Pressable
                  onPress={() => void pickAndAddImage()}
                  disabled={photoBusy}
                  accessibilityRole="button"
                  accessibilityLabel={t("spots.addPhoto")}
                  style={[styles.thumb, styles.addThumb, { borderColor: theme.colors.border }]}
                  testID="add-image"
                >
                  {photoBusy ? (
                    <ActivityIndicator color={theme.colors.textSecondary} />
                  ) : (
                    <Ionicons name="add" size={24} color={theme.colors.textSecondary} />
                  )}
                </Pressable>
              ) : null}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  multiline: {
    minHeight: 100,
  },
  compositionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  compositionCell: {
    width: "30%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  colorSwatch: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  selectedColorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  selectedColorItem: {
    position: "relative",
  },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  thumb: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  addThumb: {
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  coverTag: {
    position: "absolute",
    left: 4,
    bottom: 4,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  coverText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  removeColorBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
});
