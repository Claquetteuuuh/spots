import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { COMPOSITION_TYPES, type CompositionType } from "@trs/shared/constants";
import { useTheme, type Theme } from "../../theme";
import { useSpotsStore } from "../../stores/spots-store";
import { useAuthStore } from "../../stores/auth-store";
import { uploadPhoto, reverseGeocode } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import type { MainTabNavigationProp } from "../../navigation/types";

const TOTAL_STEPS = 5;

const PRESET_COLORS = [
  "#FAFAF8",
  "#D4A574",
  "#8B7355",
  "#6B5740",
  "#7D8C6E",
  "#5B6850",
  "#2E4A3E",
  "#4A6FA5",
  "#C44536",
  "#D4A017",
  "#6B6960",
  "#1A1A18",
];

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string | null;
  city?: string | null;
  country?: string | null;
}

/**
 * Minimal geometric placeholder for a composition type. Stands in for a
 * proper icon set — swap for real SVGs later without touching layout.
 */
function CompositionIcon({ type, color }: { type: CompositionType; color: string }) {
  const box = { width: 26, height: 26 };
  const line = (style: object) => (
    <View style={[{ position: "absolute", backgroundColor: color }, style]} />
  );

  switch (type) {
    case "SYMMETRY":
      return (
        <View style={box}>
          {line({ left: 12, top: 2, width: 2, height: 22 })}
          {line({ left: 4, top: 6, width: 6, height: 14 })}
          {line({ left: 16, top: 6, width: 6, height: 14 })}
        </View>
      );
    case "ASYMMETRY":
      return (
        <View style={box}>
          {line({ left: 4, top: 4, width: 8, height: 8 })}
          {line({ left: 16, top: 16, width: 6, height: 6 })}
        </View>
      );
    case "FRAME_IN_FRAME":
      return (
        <View
          style={[box, { borderWidth: 2, borderColor: color, alignItems: "center", justifyContent: "center" }]}
        >
          <View style={{ width: 12, height: 12, borderWidth: 2, borderColor: color }} />
        </View>
      );
    case "FIBONACCI":
      return (
        <View style={box}>
          {line({ left: 0, top: 0, width: 26, height: 26, backgroundColor: "transparent", borderWidth: 1.5, borderColor: color })}
          {line({ left: 0, top: 10, width: 16, height: 16, backgroundColor: "transparent", borderWidth: 1.5, borderColor: color })}
          {line({ left: 0, top: 16, width: 10, height: 10, backgroundColor: "transparent", borderWidth: 1.5, borderColor: color })}
        </View>
      );
    case "RULE_OF_THIRDS":
      return (
        <View style={box}>
          {line({ left: 8, top: 0, width: 1.5, height: 26 })}
          {line({ left: 16, top: 0, width: 1.5, height: 26 })}
          {line({ left: 0, top: 8, width: 26, height: 1.5 })}
          {line({ left: 0, top: 16, width: 26, height: 1.5 })}
        </View>
      );
    case "LEADING_LINES":
      return (
        <View style={box}>
          {line({ left: 12, top: 0, width: 2, height: 20, transform: [{ rotate: "20deg" }] })}
          {line({ left: 12, top: 0, width: 2, height: 20, transform: [{ rotate: "-20deg" }] })}
        </View>
      );
    case "DIAGONAL":
      return (
        <View style={box}>
          {line({ left: 12, top: 0, width: 2, height: 26, transform: [{ rotate: "35deg" }] })}
        </View>
      );
    case "CENTERED":
      return (
        <View style={[box, { alignItems: "center", justifyContent: "center" }]}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
        </View>
      );
    case "MINIMALIST":
      return (
        <View style={box}>
          {line({ left: 18, top: 18, width: 5, height: 5 })}
        </View>
      );
    case "PATTERN":
      return (
        <View style={[box, { flexDirection: "row", flexWrap: "wrap", gap: 2 }]}>
          {Array.from({ length: 9 }).map((_, i) => (
            <View key={i} style={{ width: 4, height: 4, backgroundColor: color }} />
          ))}
        </View>
      );
    default:
      return <View style={box} />;
  }
}

export function AddSpotScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation<MainTabNavigationProp<"Add">>();
  const createSpot = useSpotsStore((s) => s.createSpot);
  const user = useAuthStore((s) => s.user);

  const [step, setStep] = useState(0);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = React.useRef<CameraView | null>(null);

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedCompositions, setSelectedCompositions] = useState<CompositionType[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isFree, setIsFree] = useState(true);
  const [priceInfo, setPriceInfo] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const resolveLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const position = await Location.getCurrentPositionAsync({});
      const coords: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      try {
        const geo = await reverseGeocode(coords.latitude, coords.longitude);
        coords.address = geo.address;
        coords.city = geo.city;
        coords.country = geo.country;
      } catch {
        // Reverse geocoding is best-effort; coordinates alone are enough to proceed.
      }
      setLocation(coords);
    } finally {
      setIsLocating(false);
    }
  };

  const openCamera = async () => {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) return;
    }
    setIsCameraOpen(true);
  };

  const takePicture = async () => {
    const photo = await cameraRef.current?.takePictureAsync({ quality: 0.7 });
    if (photo?.uri) {
      setPhotoUri(photo.uri);
      setIsCameraOpen(false);
      void resolveLocation();
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      void resolveLocation();
    }
  };

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : prev.length < 10 ? [...prev, color] : prev
    );
  };

  const toggleComposition = (type: CompositionType) => {
    setSelectedCompositions((prev) =>
      prev.includes(type) ? prev.filter((c) => c !== type) : prev.length < 5 ? [...prev, type] : prev
    );
  };

  const addTag = () => {
    const value = tagInput.trim();
    if (value && !tags.includes(value) && tags.length < 10) {
      setTags((prev) => [...prev, value]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag));

  const canProceed = () => {
    switch (step) {
      case 0:
        return Boolean(photoUri && location);
      case 1:
        return selectedColors.length > 0;
      case 2:
        return selectedCompositions.length > 0;
      default:
        return true;
    }
  };

  const goNext = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const resetWizard = () => {
    setStep(0);
    setPhotoUri(null);
    setLocation(null);
    setSelectedColors([]);
    setSelectedCompositions([]);
    setTitle("");
    setDescription("");
    setTags([]);
    setTagInput("");
    setIsFree(true);
    setPriceInfo("");
    setSubmitError(null);
  };

  const handleSubmit = async () => {
    if (!photoUri || !location || !user) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const uploaded = await uploadPhoto(photoUri, `spot-${Date.now()}.jpg`);
      await createSpot({
        latitude: location.latitude,
        longitude: location.longitude,
        photoUrl: uploaded.url,
        photoKey: uploaded.key,
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        isFree,
        priceInfo: isFree ? undefined : priceInfo.trim() || undefined,
        colors: selectedColors,
        compositions: selectedCompositions,
        tags,
      });
      resetWizard();
      navigation.navigate("Map");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Unable to save spot");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCameraOpen) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
        <SafeAreaView style={styles.cameraControls} edges={["bottom"]}>
          <Pressable
            onPress={() => setIsCameraOpen(false)}
            style={[styles.cameraCancel, { borderColor: "#FFFFFF" }]}
          >
            <Text style={{ color: "#FFFFFF", fontSize: theme.typography.size.sm }}>{t("common.cancel")}</Text>
          </Pressable>
          <Pressable onPress={takePicture} style={styles.shutter} testID="camera-shutter" />
          <View style={{ width: 72 }} />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.bg }]} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg }}>
          <Text
            style={{
              color: theme.colors.text,
              fontSize: theme.typography.size.xl,
              fontWeight: theme.typography.weight.bold,
            }}
          >
            {t("spots.addSpot")}
          </Text>
          <StepIndicator step={step} theme={theme} />
        </View>

        <ScrollView
          contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.lg }}
          keyboardShouldPersistTaps="handled"
        >
          {step === 0 ? (
            <View style={{ gap: theme.spacing.md }}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="cover" />
              ) : (
                <View
                  style={[
                    styles.previewPlaceholder,
                    { borderColor: theme.colors.border, borderRadius: theme.radius.md },
                  ]}
                >
                  <Text style={{ color: theme.colors.textTertiary }}>{t("spots.takePhoto")}</Text>
                </View>
              )}

              <Button title={t("spots.takePhoto")} onPress={openCamera} variant="secondary" />
              <Button title={t("spots.pickPhoto")} onPress={pickFromGallery} variant="secondary" />

              <View style={{ marginTop: theme.spacing.sm }}>
                {isLocating ? (
                  <ActivityIndicator color={theme.colors.textSecondary} />
                ) : location ? (
                  <Text style={{ color: theme.colors.textSecondary, fontSize: theme.typography.size.sm }}>
                    {[location.city, location.country].filter(Boolean).join(", ") ||
                      `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
                  </Text>
                ) : photoUri ? (
                  <Button title={t("map.locateMe")} onPress={resolveLocation} variant="ghost" />
                ) : null}
              </View>
            </View>
          ) : null}

          {step === 1 ? (
            <View>
              <Text
                style={{
                  color: theme.colors.text,
                  fontSize: theme.typography.size.lg,
                  fontWeight: theme.typography.weight.semibold,
                  marginBottom: theme.spacing.md,
                }}
              >
                {t("spots.colors")}
              </Text>
              <View style={styles.colorGrid}>
                {PRESET_COLORS.map((color) => {
                  const selected = selectedColors.includes(color);
                  return (
                    <Pressable
                      key={color}
                      onPress={() => toggleColor(color)}
                      style={[
                        styles.colorSwatch,
                        {
                          backgroundColor: color,
                          borderColor: selected ? theme.colors.text : theme.colors.border,
                          borderWidth: selected ? theme.borderWidth.thick : theme.borderWidth.hairline,
                        },
                      ]}
                    />
                  );
                })}
              </View>
            </View>
          ) : null}

          {step === 2 ? (
            <View>
              <Text
                style={{
                  color: theme.colors.text,
                  fontSize: theme.typography.size.lg,
                  fontWeight: theme.typography.weight.semibold,
                  marginBottom: theme.spacing.md,
                }}
              >
                {t("spots.composition")}
              </Text>
              <View style={styles.compositionGrid}>
                {COMPOSITION_TYPES.map((type) => {
                  const selected = selectedCompositions.includes(type);
                  return (
                    <Pressable
                      key={type}
                      onPress={() => toggleComposition(type)}
                      style={[
                        styles.compositionCell,
                        {
                          borderColor: selected ? theme.colors.accent : theme.colors.border,
                          borderWidth: selected ? theme.borderWidth.thick : theme.borderWidth.hairline,
                          borderRadius: theme.radius.md,
                          backgroundColor: selected ? theme.colors.bgSecondary : theme.colors.bg,
                        },
                      ]}
                    >
                      <CompositionIcon
                        type={type}
                        color={selected ? theme.colors.accent : theme.colors.textSecondary}
                      />
                      <Text
                        numberOfLines={2}
                        style={{
                          color: selected ? theme.colors.text : theme.colors.textSecondary,
                          fontSize: theme.typography.size.xs,
                          marginTop: theme.spacing.xs,
                          textAlign: "center",
                        }}
                      >
                        {t(`compositions.${type}`)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          {step === 3 ? (
            <View style={{ gap: theme.spacing.lg }}>
              <Input
                label={t("spots.spotTitle")}
                placeholder={t("spots.spotTitlePlaceholder")}
                value={title}
                onChangeText={setTitle}
              />
              <Input
                label={t("spots.description")}
                placeholder={t("spots.descriptionPlaceholder")}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />

              <View>
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.size.xs,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  {t("spots.tags")}
                </Text>
                <View style={styles.tagInputRow}>
                  <TextInput
                    value={tagInput}
                    onChangeText={setTagInput}
                    placeholder={t("spots.tagsPlaceholder")}
                    placeholderTextColor={theme.colors.textTertiary}
                    onSubmitEditing={addTag}
                    style={[
                      styles.tagInput,
                      {
                        color: theme.colors.text,
                        borderBottomColor: theme.colors.border,
                        fontSize: theme.typography.size.base,
                      },
                    ]}
                  />
                  <Button title={t("common.save")} onPress={addTag} variant="ghost" fullWidth={false} />
                </View>
                <View style={styles.tagList}>
                  {tags.map((tag) => (
                    <Pressable
                      key={tag}
                      onPress={() => removeTag(tag)}
                      style={[
                        styles.tagChip,
                        { borderColor: theme.colors.borderDark, borderRadius: theme.radius.sm },
                      ]}
                    >
                      <Text style={{ color: theme.colors.textSecondary, fontSize: theme.typography.size.xs }}>
                        {tag} ×
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.freeToggleRow}>
                <Text
                  style={{
                    color: theme.colors.text,
                    fontSize: theme.typography.size.base,
                    fontWeight: theme.typography.weight.medium,
                  }}
                >
                  {isFree ? t("common.free") : t("common.paid")}
                </Text>
                <Switch
                  value={!isFree}
                  onValueChange={(paid) => setIsFree(!paid)}
                  trackColor={{ false: theme.colors.border, true: theme.colors.accentLight }}
                  thumbColor={theme.colors.accent}
                />
              </View>

              {!isFree ? (
                <Input
                  label={t("spots.priceInfo")}
                  value={priceInfo}
                  onChangeText={setPriceInfo}
                  placeholder={t("spots.priceInfo")}
                />
              ) : null}
            </View>
          ) : null}

          {step === 4 ? (
            <View style={{ gap: theme.spacing.md }}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="cover" />
              ) : null}
              <Text
                style={{
                  color: theme.colors.text,
                  fontSize: theme.typography.size.lg,
                  fontWeight: theme.typography.weight.semibold,
                }}
              >
                {title || t("spots.spotTitle")}
              </Text>
              {description ? (
                <Text style={{ color: theme.colors.textSecondary, fontSize: theme.typography.size.sm }}>
                  {description}
                </Text>
              ) : null}
              <View style={styles.colorRow}>
                {selectedColors.map((color) => (
                  <View key={color} style={[styles.reviewDot, { backgroundColor: color }]} />
                ))}
              </View>
              <Text style={{ color: theme.colors.textSecondary, fontSize: theme.typography.size.sm }}>
                {selectedCompositions.map((c) => t(`compositions.${c}`)).join(" · ")}
              </Text>
              {submitError ? (
                <Text style={{ color: theme.colors.error, fontSize: theme.typography.size.sm }}>
                  {submitError}
                </Text>
              ) : null}
            </View>
          ) : null}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: theme.colors.border, padding: theme.spacing.lg }]}>
          {step > 0 ? (
            <Button title={t("common.back")} onPress={goBack} variant="ghost" fullWidth={false} />
          ) : (
            <View />
          )}
          {step < TOTAL_STEPS - 1 ? (
            <Button title={t("common.next")} onPress={goNext} disabled={!canProceed()} fullWidth={false} />
          ) : (
            <Button
              title={t("common.done")}
              onPress={handleSubmit}
              loading={isSubmitting}
              fullWidth={false}
              testID="submit-spot"
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function StepIndicator({ step, theme }: { step: number; theme: Theme }) {
  return (
    <View style={[styles.stepRow, { marginTop: theme.spacing.md, gap: theme.spacing.xs }]}>
      {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
        <View
          key={index}
          style={{
            flex: 1,
            height: 2,
            backgroundColor: index <= step ? theme.colors.accent : theme.colors.border,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  stepRow: {
    flexDirection: "row",
  },
  preview: {
    width: "100%",
    aspectRatio: 4 / 3,
  },
  previewPlaceholder: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  colorSwatch: {
    width: 44,
    height: 44,
  },
  compositionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  compositionCell: {
    width: "30%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  tagInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tagInput: {
    flex: 1,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
  },
  tagList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  tagChip: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  freeToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  colorRow: {
    flexDirection: "row",
    gap: 6,
  },
  reviewDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  cameraControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 24,
  },
  cameraCancel: {
    width: 72,
    paddingVertical: 8,
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 4,
  },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFFFFF",
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.4)",
  },
});
