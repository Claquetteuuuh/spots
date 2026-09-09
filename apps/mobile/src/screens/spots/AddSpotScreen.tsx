import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { WebView } from "react-native-webview";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { COMPOSITION_TYPES, type CompositionType } from "@trs/shared/constants";
import { useTheme, type Theme } from "../../theme";
import { useSpotsStore } from "../../stores/spots-store";
import { useAuthStore } from "../../stores/auth-store";
import { uploadPhoto, reverseGeocode, forwardGeocode } from "../../lib/api";
import { extractErrorMessage } from "../../lib/error";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import type { MainTabNavigationProp } from "../../navigation/types";
import type { ForwardGeocodeResult } from "../../types";

const TOTAL_STEPS = 5;
const MAX_PHOTOS = 10;

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

interface PhotoItem {
  uri: string;
  id: string; // unique key for list rendering
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

let photoIdCounter = 0;
function makePhotoId() {
  return `photo_${Date.now()}_${photoIdCounter++}`;
}

// ─── Color helpers ─────────────────────────────────────────────────

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((x) => Math.max(0, Math.min(255, x)).toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

function hslToHex(h: number, s: number, l: number): string {
  const sn = s / 100;
  const ln = l / 100;
  const a = sn * Math.min(ln, 1 - ln);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = ln - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

function parseColorInput(input: string): string | null {
  const trimmed = input.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) return trimmed.toUpperCase();
  const rgbMatch = trimmed.match(
    /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i,
  );
  if (rgbMatch) return rgbToHex(+rgbMatch[1], +rgbMatch[2], +rgbMatch[3]);
  const hslMatch = trimmed.match(
    /^hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%?\s*,\s*(\d{1,3})%?\s*\)$/i,
  );
  if (hslMatch) return hslToHex(+hslMatch[1], +hslMatch[2], +hslMatch[3]);
  return null;
}

const HUE_SAMPLES = [
  { hue: 0, label: "Red" },
  { hue: 30, label: "Orange" },
  { hue: 60, label: "Yellow" },
  { hue: 90, label: "Lime" },
  { hue: 120, label: "Green" },
  { hue: 160, label: "Teal" },
  { hue: 195, label: "Cyan" },
  { hue: 220, label: "Blue" },
  { hue: 260, label: "Indigo" },
  { hue: 280, label: "Purple" },
  { hue: 320, label: "Magenta" },
  { hue: 350, label: "Pink" },
];

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

  // Multi-photo state
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedCompositions, setSelectedCompositions] = useState<CompositionType[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [visibility, setVisibility] = useState<"PRIVATE" | "FOLLOWERS">("FOLLOWERS");
  const [customComposition, setCustomComposition] = useState("");

  // Advanced color picker state
  const [colorInput, setColorInput] = useState("");
  const [colorPreview, setColorPreview] = useState<string | null>(null);
  const [selectedHue, setSelectedHue] = useState<number | null>(null);

  // Color wheel modal
  const [showColorWheel, setShowColorWheel] = useState(false);
  const [wheelColor, setWheelColor] = useState("#8B7355");

  // Photo eyedropper
  const [showEyedropper, setShowEyedropper] = useState(false);
  const [eyedropperPhotoIndex, setEyedropperPhotoIndex] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Address search state
  const [addressQuery, setAddressQuery] = useState("");
  const [addressResults, setAddressResults] = useState<ForwardGeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchDone, setSearchDone] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Manual coordinates state
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");

  // Debounced address search
  useEffect(() => {
    if (addressQuery.length < 2) {
      setAddressResults([]);
      setSearchDone(false);
      return;
    }
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(async () => {
      setIsSearching(true);
      setSearchDone(false);
      try {
        const results = await forwardGeocode(addressQuery);
        setAddressResults(results);
      } catch {
        setAddressResults([]);
      } finally {
        setIsSearching(false);
        setSearchDone(true);
      }
    }, 300);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [addressQuery]);

  /**
   * Single source of truth for setting a location.
   * Syncs lat/lng fields, address query, and location object.
   */
  const applyLocation = useCallback(async (lat: number, lng: number, opts?: {
    address?: string | null;
    city?: string | null;
    country?: string | null;
    skipReverseGeocode?: boolean;
  }) => {
    const loc: LocationData = { latitude: lat, longitude: lng };
    setManualLat(String(lat));
    setManualLng(String(lng));

    if (opts?.address !== undefined) {
      loc.address = opts.address;
      setAddressQuery(opts.address ?? "");
    }
    if (opts?.city !== undefined) loc.city = opts.city;
    if (opts?.country !== undefined) loc.country = opts.country;

    if (!opts?.skipReverseGeocode) {
      try {
        const geo = await reverseGeocode(lat, lng);
        loc.address = geo.address;
        loc.city = geo.city;
        loc.country = geo.country;
        if (geo.address) setAddressQuery(geo.address);
      } catch {
        // Reverse geocoding is best-effort
      }
    }

    setLocation(loc);
    setAddressResults([]);
    setSearchDone(false);
  }, []);

  const selectAddressResult = (result: ForwardGeocodeResult) => {
    void applyLocation(result.latitude, result.longitude, {
      address: result.displayName,
      city: result.city,
      country: result.country,
      skipReverseGeocode: true,
    });
  };

  const applyManualCoords = async () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return;
    await applyLocation(lat, lng);
  };

  const resolveLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const position = await Location.getCurrentPositionAsync({});
      await applyLocation(position.coords.latitude, position.coords.longitude);
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
      setPhotos((prev) => {
        if (prev.length >= MAX_PHOTOS) return prev;
        return [...prev, { uri: photo.uri, id: makePhotoId() }];
      });
      setIsCameraOpen(false);
      if (!location) void resolveLocation();
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photos.length,
    });
    if (!result.canceled && result.assets.length > 0) {
      const newPhotos = result.assets
        .slice(0, MAX_PHOTOS - photos.length)
        .map((asset) => ({ uri: asset.uri, id: makePhotoId() }));
      setPhotos((prev) => [...prev, ...newPhotos]);
      if (!location) void resolveLocation();
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setDragIndex(null);
  };

  const handlePhotoTap = useCallback(
    (index: number) => {
      if (dragIndex === null) return;
      if (dragIndex === index) {
        // Tap same photo — cancel drag
        setDragIndex(null);
        return;
      }
      // Swap photos
      setPhotos((prev) => {
        const next = [...prev];
        const temp = next[dragIndex];
        next[dragIndex] = next[index];
        next[index] = temp;
        return next;
      });
      setDragIndex(null);
    },
    [dragIndex],
  );

  const handlePhotoLongPress = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

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

  const handleColorInputChange = (text: string) => {
    setColorInput(text);
    const parsed = parseColorInput(text);
    setColorPreview(parsed);
  };

  const addCustomColor = () => {
    if (!colorPreview || selectedColors.length >= 10) return;
    if (!selectedColors.includes(colorPreview)) {
      setSelectedColors((prev) => [...prev, colorPreview]);
    }
    setColorInput("");
    setColorPreview(null);
  };

  const addShadeColor = (hex: string) => {
    if (selectedColors.length >= 10 || selectedColors.includes(hex)) return;
    setSelectedColors((prev) => [...prev, hex]);
    setSelectedHue(null);
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
        return photos.length > 0 && location !== null;
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
    setPhotos([]);
    setDragIndex(null);
    setLocation(null);
    setSelectedColors([]);
    setSelectedCompositions([]);
    setTitle("");
    setDescription("");
    setTags([]);
    setTagInput("");
    setVisibility("FOLLOWERS");
    setCustomComposition("");
    setColorInput("");
    setColorPreview(null);
    setSelectedHue(null);
    setSubmitError(null);
    setValidationErrors([]);
    setAddressQuery("");
    setAddressResults([]);
    setSearchDone(false);
    setManualLat("");
    setManualLng("");
  };

  // ── Validation ─────────────────────────────────────────────────────

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  function validateForm(): string[] {
    const errors: string[] = [];

    if (photos.length === 0) {
      errors.push(t("spots.validation.photosRequired"));
    }
    if (!location) {
      errors.push(t("spots.validation.locationRequired"));
    }
    if (title && title.length > 200) {
      errors.push(t("spots.validation.titleTooLong"));
    }
    if (description && description.length > 2000) {
      errors.push(t("spots.validation.descriptionTooLong"));
    }

    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    const invalidColors = selectedColors.filter((c) => !hexRegex.test(c));
    if (invalidColors.length > 0) {
      errors.push(t("spots.validation.invalidColors", { colors: invalidColors.join(", ") }));
    }

    if (tags.some((tag) => tag.length > 50)) {
      errors.push(t("spots.validation.tagTooLong"));
    }

    return errors;
  }

  const handleSubmit = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors([]);

    if (photos.length === 0 || !location || !user) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      // Upload all photos in parallel
      const uploads = await Promise.all(
        photos.map((p, i) => uploadPhoto(p.uri, `spot-${Date.now()}-${i}.jpg`))
      );
      const photosPayload = uploads.map((u) => ({ url: u.photoUrl, key: u.photoKey }));

      await createSpot({
        latitude: location.latitude,
        longitude: location.longitude,
        photoUrl: uploads[0].photoUrl,
        photoKey: uploads[0].photoKey,
        photos: photosPayload,
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        isFree: true,
        colors: selectedColors,
        compositions: selectedCompositions,
        tags,
        visibility,
        customComposition: customComposition.trim() || undefined,
      });
      resetWizard();
      navigation.navigate("Map");
    } catch (err) {
      setSubmitError(extractErrorMessage(err, t("spots.errors.saveFailed")));
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

  const thumbSize = (Dimensions.get("window").width - 16 * 2 - 8 * 2) / 3;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.bg }]} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {/* Header */}
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
          keyboardDismissMode="on-drag"
        >
          {step === 0 ? (
            <View style={{ gap: theme.spacing.md }}>
              {/* Drag mode hint */}
              {dragIndex !== null ? (
                <View
                  style={[
                    styles.dragHint,
                    {
                      backgroundColor: theme.colors.accentLight,
                      borderColor: theme.colors.accent,
                      borderRadius: theme.radius.sm,
                    },
                  ]}
                >
                  <Text style={{ color: theme.colors.accent, fontSize: theme.typography.size.sm, textAlign: "center" }}>
                    {t("spots.tapToSwap")}
                  </Text>
                </View>
              ) : null}

              {/* Photo grid */}
              {photos.length > 0 ? (
                <View style={styles.photoGrid}>
                  {photos.map((photo, index) => (
                    <Pressable
                      key={photo.id}
                      onLongPress={() => handlePhotoLongPress(index)}
                      onPress={() => handlePhotoTap(index)}
                      style={[
                        styles.photoThumb,
                        {
                          width: thumbSize,
                          height: thumbSize,
                          borderRadius: theme.radius.sm,
                          borderWidth: dragIndex === index ? 2 : StyleSheet.hairlineWidth,
                          borderColor: dragIndex === index ? theme.colors.accent : theme.colors.border,
                          opacity: dragIndex !== null && dragIndex !== index ? 0.7 : 1,
                        },
                      ]}
                    >
                      <Image
                        source={{ uri: photo.uri }}
                        style={[StyleSheet.absoluteFill, { borderRadius: theme.radius.sm - 1 }]}
                        resizeMode="cover"
                      />
                      {/* Cover badge on first photo */}
                      {index === 0 ? (
                        <View
                          style={[
                            styles.coverBadge,
                            {
                              backgroundColor: theme.colors.accent,
                              borderRadius: theme.radius.sm,
                            },
                          ]}
                        >
                          <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "600" }}>
                            Cover
                          </Text>
                        </View>
                      ) : null}
                      {/* Order number */}
                      <View
                        style={[
                          styles.orderBadge,
                          {
                            backgroundColor: "rgba(0,0,0,0.5)",
                            borderRadius: theme.radius.sm,
                          },
                        ]}
                      >
                        <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "600" }}>
                          {index + 1}
                        </Text>
                      </View>
                      {/* Remove button */}
                      <Pressable
                        onPress={() => removePhoto(index)}
                        style={[styles.removeBtn, { backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 10 }]}
                        hitSlop={8}
                      >
                        <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "700", lineHeight: 16 }}>×</Text>
                      </Pressable>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <View
                  style={[
                    styles.previewPlaceholder,
                    {
                      borderColor: theme.colors.border,
                      borderRadius: theme.radius.sm,
                      backgroundColor: theme.colors.bgSecondary,
                    },
                  ]}
                >
                  <Text style={{ color: theme.colors.textTertiary, fontSize: theme.typography.size.base }}>
                    {t("spots.takePhoto")} <Text style={{ color: theme.colors.error }}>*</Text>
                  </Text>
                </View>
              )}

              {/* Reorder hint */}
              {photos.length > 1 && dragIndex === null ? (
                <Text
                  style={{
                    color: theme.colors.textTertiary,
                    fontSize: theme.typography.size.xs,
                    textAlign: "center",
                  }}
                >
                  {t("spots.longPressToReorder")}
                </Text>
              ) : null}

              {/* Action buttons */}
              {photos.length < MAX_PHOTOS ? (
                <View style={{ gap: theme.spacing.sm }}>
                  <Button title={t("spots.takePhoto")} onPress={openCamera} variant="secondary" />
                  <Button title={t("spots.pickPhoto")} onPress={pickFromGallery} variant="secondary" />
                </View>
              ) : (
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.size.sm,
                    textAlign: "center",
                  }}
                >
                  {t("spots.maxPhotosReached")}
                </Text>
              )}

              <Text
                style={{
                  color: theme.colors.textTertiary,
                  fontSize: theme.typography.size.xs,
                  textAlign: "center",
                }}
              >
                {photos.length}/{MAX_PHOTOS}
              </Text>

              {/* ── Location section ──────────────────────────────── */}
              <View
                style={{
                  marginTop: theme.spacing.md,
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: theme.colors.border,
                  paddingTop: theme.spacing.md,
                  gap: theme.spacing.md,
                }}
              >
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.size.xs,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {t("map.title")} <Text style={{ color: theme.colors.error }}>*</Text>
                </Text>

                {/* Address search */}
                <View>
                  <TextInput
                    value={addressQuery}
                    onChangeText={setAddressQuery}
                    placeholder={t("map.searchAddress")}
                    placeholderTextColor={theme.colors.textTertiary}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={{
                      color: theme.colors.text,
                      backgroundColor: theme.colors.bgSecondary,
                      borderColor: theme.colors.border,
                      borderWidth: StyleSheet.hairlineWidth,
                      borderRadius: theme.radius.sm,
                      fontSize: theme.typography.size.sm,
                      paddingHorizontal: theme.spacing.md,
                      paddingVertical: theme.spacing.md,
                    }}
                  />

                  {/* Search results */}
                  {isSearching ? (
                    <ActivityIndicator
                      color={theme.colors.textSecondary}
                      style={{ marginTop: theme.spacing.sm }}
                    />
                  ) : addressResults.length > 0 ? (
                    <View
                      style={{
                        marginTop: theme.spacing.xs,
                        borderWidth: StyleSheet.hairlineWidth,
                        borderColor: theme.colors.border,
                        borderRadius: theme.radius.sm,
                        backgroundColor: theme.colors.bgSecondary,
                        overflow: "hidden",
                      }}
                    >
                      {addressResults.map((result, idx) => (
                        <Pressable
                          key={`${result.latitude}-${result.longitude}-${idx}`}
                          onPress={() => selectAddressResult(result)}
                          style={({ pressed }) => ({
                            paddingHorizontal: theme.spacing.md,
                            paddingVertical: theme.spacing.sm,
                            backgroundColor: pressed
                              ? theme.colors.bgTertiary
                              : theme.colors.bgSecondary,
                            borderBottomWidth:
                              idx < addressResults.length - 1
                                ? StyleSheet.hairlineWidth
                                : 0,
                            borderBottomColor: theme.colors.border,
                          })}
                        >
                          <Text
                            numberOfLines={2}
                            style={{
                              color: theme.colors.text,
                              fontSize: theme.typography.size.sm,
                            }}
                          >
                            {result.displayName}
                          </Text>
                          {result.city || result.country ? (
                            <Text
                              style={{
                                color: theme.colors.textTertiary,
                                fontSize: theme.typography.size.xs,
                                marginTop: 2,
                              }}
                            >
                              {[result.city, result.country]
                                .filter(Boolean)
                                .join(", ")}
                            </Text>
                          ) : null}
                        </Pressable>
                      ))}
                    </View>
                  ) : searchDone && addressQuery.length >= 2 ? (
                    <Text
                      style={{
                        color: theme.colors.textTertiary,
                        fontSize: theme.typography.size.xs,
                        marginTop: theme.spacing.sm,
                        textAlign: "center",
                      }}
                    >
                      {t("map.noResults")}
                    </Text>
                  ) : null}
                </View>

                {/* Coordinates */}
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.size.xs,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {t("map.orEnterCoords")}
                </Text>
                <View style={{ gap: theme.spacing.sm }}>
                  <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
                    <TextInput
                      value={manualLat}
                      onChangeText={setManualLat}
                      onEndEditing={applyManualCoords}
                      placeholder={t("map.latitudePlaceholder")}
                      placeholderTextColor={theme.colors.textTertiary}
                      keyboardType="numeric"
                      style={{
                        flex: 1,
                        color: theme.colors.text,
                        backgroundColor: theme.colors.bgSecondary,
                        borderColor: theme.colors.border,
                        borderWidth: StyleSheet.hairlineWidth,
                        borderRadius: theme.radius.sm,
                        fontSize: theme.typography.size.sm,
                        paddingHorizontal: theme.spacing.md,
                        paddingVertical: theme.spacing.md,
                      }}
                    />
                    <TextInput
                      value={manualLng}
                      onChangeText={setManualLng}
                      onEndEditing={applyManualCoords}
                      placeholder={t("map.longitudePlaceholder")}
                      placeholderTextColor={theme.colors.textTertiary}
                      keyboardType="numeric"
                      style={{
                        flex: 1,
                        color: theme.colors.text,
                        backgroundColor: theme.colors.bgSecondary,
                        borderColor: theme.colors.border,
                        borderWidth: StyleSheet.hairlineWidth,
                        borderRadius: theme.radius.sm,
                        fontSize: theme.typography.size.sm,
                        paddingHorizontal: theme.spacing.md,
                        paddingVertical: theme.spacing.md,
                      }}
                    />
                  </View>
                  <Button
                    title={t("map.setCoordinates")}
                    onPress={applyManualCoords}
                    variant="secondary"
                    disabled={!manualLat.trim() || !manualLng.trim()}
                  />
                </View>

                {/* GPS locate button */}
                <Button
                  title={t("map.locateMe")}
                  onPress={resolveLocation}
                  variant="ghost"
                  loading={isLocating}
                />

                {/* Map picker */}
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.size.xs,
                    textAlign: "center",
                  }}
                >
                  {t("map.clickMapHint")}
                </Text>
                <View
                  style={{
                    height: 200,
                    borderRadius: theme.radius.sm,
                    overflow: "hidden",
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: theme.colors.border,
                  }}
                >
                  <MapView
                    provider={PROVIDER_DEFAULT}
                    style={StyleSheet.absoluteFill}
                    initialRegion={{
                      latitude: location?.latitude ?? 48.8566,
                      longitude: location?.longitude ?? 2.3522,
                      latitudeDelta: location ? 0.02 : 5,
                      longitudeDelta: location ? 0.02 : 5,
                    }}
                    onPress={(e) => {
                      const { latitude, longitude } = e.nativeEvent.coordinate;
                      void applyLocation(latitude, longitude);
                    }}
                  >
                    {location ? (
                      <Marker coordinate={{ latitude: location.latitude, longitude: location.longitude }}>
                        <View
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: 7,
                            backgroundColor: theme.colors.accent,
                            borderWidth: 2,
                            borderColor: theme.colors.bg,
                          }}
                        />
                      </Marker>
                    ) : null}
                  </MapView>
                </View>

                {/* Current location display */}
                {location ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: theme.spacing.sm,
                      paddingVertical: theme.spacing.xs,
                      paddingHorizontal: theme.spacing.sm,
                      backgroundColor: theme.colors.bgSecondary,
                      borderRadius: theme.radius.sm,
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor: theme.colors.border,
                    }}
                  >
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: theme.colors.sage,
                      }}
                    />
                    <Text
                      numberOfLines={2}
                      style={{
                        flex: 1,
                        color: theme.colors.text,
                        fontSize: theme.typography.size.sm,
                      }}
                    >
                      {[location.city, location.country].filter(Boolean).join(", ") ||
                        `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
                    </Text>
                    <Pressable
                      onPress={() => setLocation(null)}
                      hitSlop={8}
                    >
                      <Text
                        style={{
                          color: theme.colors.textTertiary,
                          fontSize: theme.typography.size.sm,
                        }}
                      >
                        ×
                      </Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}

          {step === 1 ? (
            <View style={{ gap: theme.spacing.lg }}>
              <Text
                style={{
                  color: theme.colors.text,
                  fontSize: theme.typography.size.md,
                  fontWeight: theme.typography.weight.semibold,
                }}
              >
                {t("spots.colors")} <Text style={{ color: theme.colors.error }}>*</Text>
              </Text>

              {/* Preset color grid */}
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
                          borderRadius: theme.radius.sm,
                        },
                      ]}
                    />
                  );
                })}
              </View>

              {/* Selected count */}
              <Text style={{ color: theme.colors.textTertiary, fontSize: theme.typography.size.xs }}>
                {selectedColors.length}/10
              </Text>

              {/* Color tools: wheel + eyedropper */}
              <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
                {/* Color wheel button */}
                <Pressable
                  onPress={() => setShowColorWheel(true)}
                  disabled={selectedColors.length >= 10}
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    paddingVertical: theme.spacing.md,
                    backgroundColor: theme.colors.bgSecondary,
                    borderRadius: theme.radius.sm,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: theme.colors.border,
                    opacity: selectedColors.length >= 10 ? 0.4 : 1,
                  }}
                >
                  <Ionicons name="color-palette-outline" size={18} color={theme.colors.text} />
                  <Text style={{ color: theme.colors.text, fontSize: theme.typography.size.sm }}>
                    {t("spots.pickColor")}
                  </Text>
                </Pressable>

                {/* Eyedropper button */}
                <Pressable
                  onPress={() => {
                    if (photos.length > 0) {
                      setEyedropperPhotoIndex(0);
                      setShowEyedropper(true);
                    }
                  }}
                  disabled={photos.length === 0 || selectedColors.length >= 10}
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    paddingVertical: theme.spacing.md,
                    backgroundColor: theme.colors.bgSecondary,
                    borderRadius: theme.radius.sm,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: theme.colors.border,
                    opacity: photos.length === 0 || selectedColors.length >= 10 ? 0.4 : 1,
                  }}
                >
                  <Ionicons name="eyedrop-outline" size={18} color={theme.colors.text} />
                  <Text style={{ color: theme.colors.text, fontSize: theme.typography.size.sm }}>
                    {t("spots.pickFromPhoto")}
                  </Text>
                </Pressable>
              </View>

              {/* ── More colors section ──────────────────────────── */}
              <Text
                style={{
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.size.xs,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                {t("spots.moreColors")}
              </Text>

              {/* Hue samples row */}
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {HUE_SAMPLES.map((sample) => {
                  const sampleColor = hslToHex(sample.hue, 70, 50);
                  const isSelected = selectedHue === sample.hue;
                  return (
                    <Pressable
                      key={sample.hue}
                      onPress={() => setSelectedHue(isSelected ? null : sample.hue)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: sampleColor,
                        borderWidth: isSelected ? 3 : StyleSheet.hairlineWidth,
                        borderColor: isSelected ? theme.colors.text : theme.colors.border,
                      }}
                    />
                  );
                })}
              </View>

              {/* Shade picker for selected hue */}
              {selectedHue !== null ? (
                <View style={{ gap: theme.spacing.xs }}>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: theme.typography.size.xs }}>
                    {t("spots.selectShade")}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {[20, 35, 50, 65, 80].map((lightness) => {
                      const shade = hslToHex(selectedHue, 70, lightness);
                      const alreadySelected = selectedColors.includes(shade);
                      return (
                        <Pressable
                          key={lightness}
                          onPress={() => addShadeColor(shade)}
                          disabled={alreadySelected}
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: theme.radius.sm,
                            backgroundColor: shade,
                            borderWidth: alreadySelected ? theme.borderWidth.thick : StyleSheet.hairlineWidth,
                            borderColor: alreadySelected ? theme.colors.text : theme.colors.border,
                            opacity: alreadySelected ? 0.5 : 1,
                          }}
                        />
                      );
                    })}
                  </View>
                </View>
              ) : null}

              {/* Color code input */}
              <View style={{ gap: theme.spacing.xs }}>
                <Text style={{ color: theme.colors.textSecondary, fontSize: theme.typography.size.xs }}>
                  {t("spots.pickColor")}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}>
                  <TextInput
                    value={colorInput}
                    onChangeText={handleColorInputChange}
                    placeholder={t("spots.colorInputPlaceholder")}
                    placeholderTextColor={theme.colors.textTertiary}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={{
                      flex: 1,
                      color: theme.colors.text,
                      backgroundColor: theme.colors.bgSecondary,
                      borderColor: theme.colors.border,
                      borderWidth: StyleSheet.hairlineWidth,
                      borderRadius: theme.radius.sm,
                      fontSize: theme.typography.size.sm,
                      paddingHorizontal: theme.spacing.md,
                      paddingVertical: theme.spacing.md,
                    }}
                  />
                  {/* Color preview swatch */}
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: theme.radius.sm,
                      backgroundColor: colorPreview ?? theme.colors.bgTertiary,
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor: theme.colors.border,
                    }}
                  />
                  <Pressable
                    onPress={addCustomColor}
                    disabled={!colorPreview || selectedColors.length >= 10}
                    style={{
                      paddingHorizontal: theme.spacing.md,
                      paddingVertical: theme.spacing.sm,
                      backgroundColor: colorPreview ? theme.colors.accent : theme.colors.bgTertiary,
                      borderRadius: theme.radius.sm,
                      opacity: colorPreview && selectedColors.length < 10 ? 1 : 0.4,
                    }}
                  >
                    <Text
                      style={{
                        color: colorPreview ? "#FFFFFF" : theme.colors.textTertiary,
                        fontSize: theme.typography.size.sm,
                        fontWeight: theme.typography.weight.semibold,
                      }}
                    >
                      {t("spots.addColor")}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Show selected colors below */}
              {selectedColors.length > 0 ? (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  {selectedColors.map((color) => (
                    <Pressable
                      key={color}
                      onPress={() => toggleColor(color)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: color,
                        borderWidth: StyleSheet.hairlineWidth,
                        borderColor: theme.colors.border,
                      }}
                    />
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}

          {step === 2 ? (
            <View style={{ gap: theme.spacing.lg }}>
              <Text
                style={{
                  color: theme.colors.text,
                  fontSize: theme.typography.size.md,
                  fontWeight: theme.typography.weight.semibold,
                }}
              >
                {t("spots.composition")} <Text style={{ color: theme.colors.error }}>*</Text>
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

              {/* Custom composition input — shown when OTHER is selected */}
              {selectedCompositions.includes("OTHER") ? (
                <View style={{ gap: theme.spacing.xs }}>
                  <Text
                    style={{
                      color: theme.colors.textSecondary,
                      fontSize: theme.typography.size.xs,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    {t("spots.customComposition")}
                  </Text>
                  <TextInput
                    value={customComposition}
                    onChangeText={setCustomComposition}
                    placeholder={t("spots.customCompositionPlaceholder")}
                    placeholderTextColor={theme.colors.textTertiary}
                    maxLength={100}
                    style={{
                      color: theme.colors.text,
                      backgroundColor: theme.colors.bgSecondary,
                      borderColor: theme.colors.border,
                      borderWidth: StyleSheet.hairlineWidth,
                      borderRadius: theme.radius.sm,
                      fontSize: theme.typography.size.sm,
                      paddingHorizontal: theme.spacing.md,
                      paddingVertical: theme.spacing.md,
                    }}
                  />
                </View>
              ) : null}
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
                        backgroundColor: theme.colors.bgSecondary,
                        borderColor: theme.colors.border,
                        borderWidth: StyleSheet.hairlineWidth,
                        borderRadius: theme.radius.md,
                        fontSize: theme.typography.size.base,
                        paddingHorizontal: theme.spacing.lg,
                        paddingVertical: theme.spacing.md,
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
                        {
                          borderColor: theme.colors.border,
                          borderRadius: theme.radius.sm,
                          backgroundColor: theme.colors.bgSecondary,
                        },
                      ]}
                    >
                      <Text style={{ color: theme.colors.textSecondary, fontSize: theme.typography.size.xs }}>
                        {tag} ×
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Visibility selector */}
              <View style={{ gap: theme.spacing.sm }}>
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.size.xs,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {t("spots.visibilityTitle")}
                </Text>
                <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
                  <Pressable
                    onPress={() => setVisibility("FOLLOWERS")}
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: theme.spacing.sm,
                      paddingVertical: theme.spacing.md,
                      borderWidth: visibility === "FOLLOWERS" ? theme.borderWidth.thick : StyleSheet.hairlineWidth,
                      borderColor: visibility === "FOLLOWERS" ? theme.colors.sage : theme.colors.border,
                      borderRadius: theme.radius.sm,
                      backgroundColor: visibility === "FOLLOWERS" ? `${theme.colors.sage}15` : theme.colors.bg,
                    }}
                  >
                    <Ionicons
                      name="people-outline"
                      size={16}
                      color={visibility === "FOLLOWERS" ? theme.colors.sage : theme.colors.textSecondary}
                    />
                    <Text
                      style={{
                        color: visibility === "FOLLOWERS" ? theme.colors.sage : theme.colors.textSecondary,
                        fontSize: theme.typography.size.sm,
                        fontWeight: theme.typography.weight.medium,
                      }}
                    >
                      {t("spots.visibilityFollowers")}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setVisibility("PRIVATE")}
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: theme.spacing.sm,
                      paddingVertical: theme.spacing.md,
                      borderWidth: visibility === "PRIVATE" ? theme.borderWidth.thick : StyleSheet.hairlineWidth,
                      borderColor: visibility === "PRIVATE" ? theme.colors.accent : theme.colors.border,
                      borderRadius: theme.radius.sm,
                      backgroundColor: visibility === "PRIVATE" ? `${theme.colors.accent}15` : theme.colors.bg,
                    }}
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={16}
                      color={visibility === "PRIVATE" ? theme.colors.accent : theme.colors.textSecondary}
                    />
                    <Text
                      style={{
                        color: visibility === "PRIVATE" ? theme.colors.accent : theme.colors.textSecondary,
                        fontSize: theme.typography.size.sm,
                        fontWeight: theme.typography.weight.medium,
                      }}
                    >
                      {t("spots.visibilityPrivate")}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ) : null}

          {step === 4 ? (
            <View style={{ gap: theme.spacing.md }}>
              {/* Main cover photo */}
              {photos.length > 0 ? (
                <Image
                  source={{ uri: photos[0].uri }}
                  style={[styles.preview, { borderRadius: theme.radius.sm }]}
                  resizeMode="cover"
                />
              ) : null}
              {/* Thumbnail strip for additional photos */}
              {photos.length > 1 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: theme.spacing.sm }}
                >
                  {photos.slice(1).map((photo, index) => (
                    <Image
                      key={photo.id}
                      source={{ uri: photo.uri }}
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: theme.radius.sm,
                        borderWidth: StyleSheet.hairlineWidth,
                        borderColor: theme.colors.border,
                      }}
                      resizeMode="cover"
                    />
                  ))}
                </ScrollView>
              ) : null}
              <Text
                style={{
                  color: theme.colors.textTertiary,
                  fontSize: theme.typography.size.xs,
                }}
              >
                {photos.length} {photos.length === 1 ? "photo" : "photos"}
              </Text>
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
                {customComposition ? ` — ${customComposition}` : ""}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.xs }}>
                <Ionicons
                  name={visibility === "PRIVATE" ? "lock-closed-outline" : "people-outline"}
                  size={14}
                  color={theme.colors.textSecondary}
                />
                <Text style={{ color: theme.colors.textSecondary, fontSize: theme.typography.size.sm }}>
                  {visibility === "PRIVATE" ? t("spots.visibilityPrivate") : t("spots.visibilityFollowers")}
                </Text>
              </View>
              {validationErrors.length > 0 ? (
                <View
                  style={{
                    backgroundColor: `${theme.colors.error}10`,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: `${theme.colors.error}40`,
                    borderRadius: theme.radius.sm,
                    padding: theme.spacing.md,
                    gap: theme.spacing.xs,
                  }}
                >
                  {validationErrors.map((msg, i) => (
                    <Text
                      key={i}
                      style={{
                        color: theme.colors.error,
                        fontSize: theme.typography.size.sm,
                      }}
                    >
                      ⚠ {msg}
                    </Text>
                  ))}
                </View>
              ) : null}
              {submitError ? (
                <Text style={{ color: theme.colors.error, fontSize: theme.typography.size.sm }}>
                  {submitError}
                </Text>
              ) : null}
            </View>
          ) : null}
        </ScrollView>

        {/* Footer navigation */}
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

      {/* ── Color Wheel Modal (WebView-based) ────────────── */}
      <Modal visible={showColorWheel} animationType="slide" transparent onRequestClose={() => setShowColorWheel(false)}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" }}>
          <View
            style={{
              backgroundColor: theme.colors.bg,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingTop: theme.spacing.lg,
              paddingBottom: 40,
              height: 480,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: theme.spacing.lg, marginBottom: theme.spacing.sm }}>
              <Text style={{ color: theme.colors.text, fontSize: theme.typography.size.md, fontWeight: theme.typography.weight.semibold }}>
                {t("spots.pickColor")}
              </Text>
              <Pressable onPress={() => setShowColorWheel(false)} hitSlop={12}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </Pressable>
            </View>

            <WebView
              originWhitelist={["*"]}
              source={{
                html: `<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,system-ui,sans-serif;padding:16px;background:${theme.colors.bg};color:${theme.colors.text}}
.wheel{position:relative;width:240px;height:240px;margin:0 auto 16px;border-radius:50%;background:conic-gradient(hsl(0,100%,50%),hsl(60,100%,50%),hsl(120,100%,50%),hsl(180,100%,50%),hsl(240,100%,50%),hsl(300,100%,50%),hsl(360,100%,50%));cursor:crosshair}
.wheel::after{content:'';position:absolute;inset:30%;border-radius:50%;background:radial-gradient(circle,#fff 0%,transparent 70%)}
.sl{display:flex;gap:12px;align-items:center;margin-bottom:12px}
.sl label{font-size:12px;width:80px;color:${theme.colors.textSecondary}}
.sl input{flex:1;accent-color:${theme.colors.accent}}
.preview-row{display:flex;align-items:center;gap:12px;margin-bottom:12px}
.swatch{width:48px;height:48px;border-radius:8px;border:1px solid ${theme.colors.border}}
.hex{font-family:monospace;font-size:16px;font-weight:600}
.btn{display:block;width:100%;padding:12px;background:${theme.colors.accent};color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer}
</style></head><body>
<div class="wheel" id="wheel"></div>
<div class="sl"><label>Saturation</label><input type="range" id="sat" min="0" max="100" value="70"></div>
<div class="sl"><label>Lightness</label><input type="range" id="lit" min="0" max="100" value="50"></div>
<div class="preview-row"><div class="swatch" id="sw"></div><span class="hex" id="hx">#8B7355</span></div>
<button class="btn" id="add">${t("spots.addColor")}</button>
<script>
let h=30,s=70,l=50;
function upd(){const c='hsl('+h+','+s+'%,'+l+'%)';document.getElementById('sw').style.background=c;
const cv=document.createElement('canvas');cv.width=1;cv.height=1;const cx=cv.getContext('2d');
cx.fillStyle=c;cx.fillRect(0,0,1,1);const p=cx.getImageData(0,0,1,1).data;
const hex='#'+[p[0],p[1],p[2]].map(v=>v.toString(16).padStart(2,'0')).join('').toUpperCase();
document.getElementById('hx').textContent=hex}
upd();
document.getElementById('wheel').addEventListener('click',function(e){
const r=this.getBoundingClientRect();const cx=r.left+r.width/2;const cy=r.top+r.height/2;
const angle=Math.atan2(e.clientY-cy,e.clientX-cx)*180/Math.PI;
h=((angle+360)%360)|0;upd()});
document.getElementById('sat').addEventListener('input',function(){s=+this.value;upd()});
document.getElementById('lit').addEventListener('input',function(){l=+this.value;upd()});
document.getElementById('add').addEventListener('click',function(){
window.ReactNativeWebView.postMessage(document.getElementById('hx').textContent)});
</script></body></html>`,
              }}
              onMessage={(event) => {
                const hex = event.nativeEvent.data;
                if (/^#[0-9A-F]{6}$/.test(hex) && !selectedColors.includes(hex) && selectedColors.length < 10) {
                  setSelectedColors((prev) => [...prev, hex]);
                }
                setShowColorWheel(false);
              }}
              style={{ flex: 1, backgroundColor: "transparent" }}
              javaScriptEnabled
              scrollEnabled={false}
            />
          </View>
        </View>
      </Modal>

      {/* ── Photo Eyedropper Modal ────────────────────────── */}
      <Modal visible={showEyedropper} animationType="slide" onRequestClose={() => setShowEyedropper(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={["top", "bottom"]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md }}>
            <Text style={{ color: theme.colors.text, fontSize: theme.typography.size.md, fontWeight: theme.typography.weight.semibold }}>
              {t("spots.pickFromPhoto")}
            </Text>
            <Pressable onPress={() => setShowEyedropper(false)} hitSlop={12}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </Pressable>
          </View>

          <Text style={{ color: theme.colors.textSecondary, fontSize: theme.typography.size.xs, textAlign: "center", marginBottom: theme.spacing.sm }}>
            {t("spots.clickPhotoToPickColor")}
          </Text>

          {/* Photo thumbnails for multi-photo selection */}
          {photos.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, gap: 8, marginBottom: theme.spacing.sm }}
            >
              {photos.map((photo, idx) => (
                <Pressable
                  key={photo.id}
                  onPress={() => setEyedropperPhotoIndex(idx)}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: theme.radius.sm,
                    overflow: "hidden",
                    borderWidth: idx === eyedropperPhotoIndex ? 2 : StyleSheet.hairlineWidth,
                    borderColor: idx === eyedropperPhotoIndex ? theme.colors.accent : theme.colors.border,
                  }}
                >
                  <Image source={{ uri: photo.uri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                </Pressable>
              ))}
            </ScrollView>
          ) : null}

          {/* WebView-based eyedropper canvas */}
          <View style={{ flex: 1, marginHorizontal: theme.spacing.lg, marginBottom: theme.spacing.lg, borderRadius: theme.radius.sm, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border }}>
            <WebView
              originWhitelist={["*"]}
              source={{
                html: `<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#000;display:flex;align-items:center;justify-content:center;height:100vh;overflow:hidden}
canvas{max-width:100%;max-height:100%;object-fit:contain;cursor:crosshair}</style></head>
<body><canvas id="c"></canvas>
<script>
const canvas=document.getElementById('c');const ctx=canvas.getContext('2d');
const img=new Image();img.crossOrigin='anonymous';
img.onload=()=>{canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;ctx.drawImage(img,0,0);};
img.src='${photos[eyedropperPhotoIndex]?.uri ?? ""}';
canvas.addEventListener('click',(e)=>{
  const rect=canvas.getBoundingClientRect();
  const x=Math.round((e.clientX-rect.left)*(canvas.width/rect.width));
  const y=Math.round((e.clientY-rect.top)*(canvas.height/rect.height));
  const p=ctx.getImageData(x,y,1,1).data;
  const hex='#'+[p[0],p[1],p[2]].map(v=>v.toString(16).padStart(2,'0')).join('').toUpperCase();
  window.ReactNativeWebView.postMessage(hex);
});
</script></body></html>`,
              }}
              onMessage={(event) => {
                const hex = event.nativeEvent.data;
                if (/^#[0-9A-F]{6}$/.test(hex) && !selectedColors.includes(hex) && selectedColors.length < 10) {
                  setSelectedColors((prev) => [...prev, hex]);
                }
                setShowEyedropper(false);
              }}
              style={{ flex: 1, backgroundColor: "transparent" }}
              javaScriptEnabled
              scrollEnabled={false}
            />
          </View>
        </SafeAreaView>
      </Modal>
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
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  photoThumb: {
    overflow: "hidden",
  },
  coverBadge: {
    position: "absolute",
    top: 4,
    left: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  orderBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  removeBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  dragHint: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
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
  },
  tagList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  tagChip: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 6,
    paddingHorizontal: 12,
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
