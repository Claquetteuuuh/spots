import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  ActivityIndicator,
  Animated,
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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
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
  // Whites & Creams
  "#FAFAF8", "#F5E6D3",
  // Earth tones
  "#D4A574", "#B49A7A", "#8B7355", "#6B5740",
  // Greens & Sage
  "#7D8C6E", "#5B6850", "#2E4A3E",
  // Blues
  "#4A6FA5", "#4A90A4", "#2C5F7C",
  // Reds & Warm
  "#C44536", "#9B2335",
  // Yellows & Gold
  "#D4A017", "#C8B560",
  // Purples
  "#6B5B8D", "#8E6F8E",
  // Neutrals
  "#6B6960", "#3D3D3D", "#1A1A18",
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

export function AddSpotScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
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

  // Color wheel modal
  const [showColorWheel, setShowColorWheel] = useState(false);

  // Photo eyedropper
  const [showEyedropper, setShowEyedropper] = useState(false);
  const [eyedropperPhotoIndex, setEyedropperPhotoIndex] = useState(0);
  const [eyedropperDataUri, setEyedropperDataUri] = useState<string | null>(null);
  const [eyedropperLoading, setEyedropperLoading] = useState(false);
  const [eyedropperPreviewColor, setEyedropperPreviewColor] = useState<string | null>(null);
  // "pick" samples colors under the finger; "pan" drags the (zoomed) photo around.
  const [eyedropperTool, setEyedropperTool] = useState<"pick" | "pan">("pick");
  const eyedropperWebViewRef = useRef<WebView>(null);

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

  /**
   * Downscale a photo natively and return it as a small base64 data URI.
   * WKWebView refuses file:// images inside inline HTML, so we embed the pixels directly.
   * Capping at 1200px keeps the payload ~150–300 KB — safe to pass through the bridge.
   */
  const prepareEyedropperPhoto = useCallback(async (photoUri: string) => {
    setEyedropperLoading(true);
    setEyedropperDataUri(null);
    try {
      const ctx = ImageManipulator.manipulate(photoUri);
      ctx.resize({ width: 1200 });
      const rendered = await ctx.renderAsync();
      const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.85, base64: true });
      if (saved.base64) {
        setEyedropperDataUri(`data:image/jpeg;base64,${saved.base64}`);
      }
    } catch {
      setEyedropperDataUri(null);
    } finally {
      setEyedropperLoading(false);
    }
  }, []);

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
    setEyedropperDataUri(null);
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
                        backgroundColor: theme.colors.accent,
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
                      setEyedropperPreviewColor(null);
                      setShowEyedropper(true);
                      void prepareEyedropperPhoto(photos[0].uri);
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

              {/* Selected colors */}
              {selectedColors.length > 0 ? (
                <View style={{ gap: theme.spacing.xs }}>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: theme.typography.size.xs, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {t("spots.selectedColors")} ({selectedColors.length}/10)
                  </Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {selectedColors.map((color) => (
                      <View key={color} style={{ position: "relative" }}>
                        <View
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: theme.radius.sm,
                            backgroundColor: color,
                            borderWidth: StyleSheet.hairlineWidth,
                            borderColor: theme.colors.border,
                          }}
                        />
                        <Pressable
                          onPress={() => toggleColor(color)}
                          hitSlop={4}
                          style={{
                            position: "absolute",
                            top: -6,
                            right: -6,
                            width: 18,
                            height: 18,
                            borderRadius: 9,
                            backgroundColor: theme.colors.bg,
                            borderWidth: StyleSheet.hairlineWidth,
                            borderColor: theme.colors.border,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text style={{ color: theme.colors.textSecondary, fontSize: 11, fontWeight: theme.typography.weight.bold, lineHeight: 13 }}>×</Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
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
                      borderColor: visibility === "FOLLOWERS" ? theme.colors.accent : theme.colors.border,
                      borderRadius: theme.radius.sm,
                      backgroundColor: visibility === "FOLLOWERS" ? theme.colors.accentTint : theme.colors.bg,
                    }}
                  >
                    <Ionicons
                      name="people-outline"
                      size={16}
                      color={visibility === "FOLLOWERS" ? theme.colors.accent : theme.colors.textSecondary}
                    />
                    <Text
                      style={{
                        color: visibility === "FOLLOWERS" ? theme.colors.accent : theme.colors.textSecondary,
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
                  {photos.slice(1).map((photo) => (
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
              height: 520,
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
body{font-family:-apple-system,system-ui,sans-serif;padding:12px 16px;background:${theme.colors.bg};color:${theme.colors.text};overflow-y:auto;-webkit-overflow-scrolling:touch}
.wheel-wrap{position:relative;width:200px;height:200px;margin:0 auto 12px}
.wheel{width:100%;height:100%;border-radius:50%;background:conic-gradient(from 0deg,hsl(0,100%,50%),hsl(60,100%,50%),hsl(120,100%,50%),hsl(180,100%,50%),hsl(240,100%,50%),hsl(300,100%,50%),hsl(360,100%,50%))}
.pointer{position:absolute;width:20px;height:20px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 4px rgba(0,0,0,.5);transform:translate(-50%,-50%);pointer-events:none;z-index:2}
.sl{display:flex;gap:8px;align-items:center;margin-bottom:10px}
.sl label{font-size:12px;min-width:72px;color:${theme.colors.textSecondary}}
.sl input[type=range]{flex:1;height:28px;accent-color:${theme.colors.accent}}
.preview-row{display:flex;align-items:center;gap:12px;margin-bottom:12px}
.swatch{width:44px;height:44px;border-radius:8px;border:1px solid ${theme.colors.border}}
.hex{font-family:monospace;font-size:15px;font-weight:600}
.btn{display:block;width:100%;padding:14px;background:${theme.colors.accent};color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;-webkit-tap-highlight-color:transparent}
</style></head><body>
<div class="wheel-wrap" id="wrap">
  <div class="wheel" id="wheel"></div>
  <div class="pointer" id="ptr"></div>
</div>
<div class="sl"><label>Saturation</label><input type="range" id="sat" min="0" max="100" value="70"></div>
<div class="sl"><label>Lightness</label><input type="range" id="lit" min="0" max="100" value="50"></div>
<div class="preview-row"><div class="swatch" id="sw"></div><span class="hex" id="hx"></span></div>
<button class="btn" id="add">${t("spots.addColor")}</button>
<script>
var h=0,s=70,l=50,R=100;
function hsl2hex(h,s,l){var c=document.createElement('canvas');c.width=1;c.height=1;
var x=c.getContext('2d');x.fillStyle='hsl('+h+','+s+'%,'+l+'%)';x.fillRect(0,0,1,1);
var p=x.getImageData(0,0,1,1).data;
return '#'+[p[0],p[1],p[2]].map(function(v){return v.toString(16).padStart(2,'0')}).join('').toUpperCase()}
function movePtr(){var a=(h-90)*Math.PI/180;var r=R*0.75;var px=R+r*Math.cos(a);var py=R+r*Math.sin(a);
var ptr=document.getElementById('ptr');ptr.style.left=px+'px';ptr.style.top=py+'px';
ptr.style.backgroundColor='hsl('+h+','+s+'%,'+l+'%)'}
function upd(){var hex=hsl2hex(h,s,l);document.getElementById('sw').style.background='hsl('+h+','+s+'%,'+l+'%)';
document.getElementById('hx').textContent=hex;movePtr()}
function pickFromEvent(e){var t=e.touches?e.touches[0]:e;
var r=document.getElementById('wrap').getBoundingClientRect();
var cx=r.left+r.width/2,cy=r.top+r.height/2;
var angle=Math.atan2(t.clientY-cy,t.clientX-cx)*180/Math.PI;
h=Math.round((angle+90+360)%360);upd()}
var w=document.getElementById('wrap');
w.addEventListener('touchstart',function(e){e.preventDefault();pickFromEvent(e)},{passive:false});
w.addEventListener('touchmove',function(e){e.preventDefault();pickFromEvent(e)},{passive:false});
w.addEventListener('click',pickFromEvent);
document.getElementById('sat').addEventListener('input',function(){s=+this.value;upd()});
document.getElementById('lit').addEventListener('input',function(){l=+this.value;upd()});
document.getElementById('add').addEventListener('click',function(){
window.ReactNativeWebView.postMessage(document.getElementById('hx').textContent)});
upd();
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
              scrollEnabled
            />
          </View>
        </View>
      </Modal>

      {/* ── Photo Eyedropper Modal ────────────────────────── */}
      <Modal visible={showEyedropper} animationType="slide" onRequestClose={() => setShowEyedropper(false)}>
        <View style={{ flex: 1, backgroundColor: theme.colors.bg, paddingTop: insets.top, paddingBottom: insets.bottom }}>
          {/* Header */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, zIndex: 10 }}>
            <Text style={{ color: theme.colors.text, fontSize: theme.typography.size.sm, fontWeight: theme.typography.weight.semibold }}>
              {t("spots.pickFromPhoto")}
            </Text>
            <Pressable
              onPress={() => setShowEyedropper(false)}
              hitSlop={16}
              style={{ padding: 4 }}
            >
              <Ionicons name="close" size={22} color={theme.colors.text} />
            </Pressable>
          </View>

          {/* Photo thumbnails for multi-photo selection */}
          {photos.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              // ScrollView defaults to flexGrow: 1 — without this it eats the photo's height.
              style={{ flexGrow: 0 }}
              contentContainerStyle={{ paddingHorizontal: theme.spacing.md, gap: 6 }}
            >
              {photos.map((photo, idx) => (
                <Pressable
                  key={photo.id}
                  onPress={() => {
                    setEyedropperPhotoIndex(idx);
                    setEyedropperPreviewColor(null);
                    void prepareEyedropperPhoto(photo.uri);
                  }}
                  style={{
                    width: 40,
                    height: 40,
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

          {/* Tool toggle: hand (pan) / eyedropper (pick) — sits right on top of the photo it controls */}
          <View style={{ alignItems: "center", paddingTop: theme.spacing.sm, paddingBottom: theme.spacing.xs }}>
            <View style={{ flexDirection: "row", backgroundColor: theme.colors.bgSecondary, borderRadius: 999, padding: 3 }}>
              {(["pan", "pick"] as const).map((tool) => {
                const active = eyedropperTool === tool;
                return (
                  <Pressable
                    key={tool}
                    accessibilityRole="button"
                    accessibilityLabel={t(tool === "pan" ? "spots.toolPan" : "spots.toolPick")}
                    accessibilityState={{ selected: active }}
                    onPress={() => {
                      setEyedropperTool(tool);
                      eyedropperWebViewRef.current?.injectJavaScript(`window.setMode('${tool}');true;`);
                    }}
                    style={{
                      paddingHorizontal: 18,
                      paddingVertical: 6,
                      borderRadius: 999,
                      backgroundColor: active ? theme.colors.accent : "transparent",
                    }}
                  >
                    <Ionicons
                      name={tool === "pan" ? "hand-left-outline" : "eyedrop-outline"}
                      size={18}
                      color={active ? theme.colors.onAccent : theme.colors.textSecondary}
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* WebView eyedropper — photo embedded as a data URI (WKWebView blocks file:// in inline HTML).
              Edge to edge, no frame: the photo gets every pixel the header and bottom bar leave. */}
          <View style={{ flex: 1, backgroundColor: theme.colors.bgSecondary }}>
            {eyedropperDataUri ? (
              <WebView
                key={eyedropperPhotoIndex}
                originWhitelist={["*"]}
                source={{
                  html: `<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;background:${theme.colors.bgSecondary};overflow:hidden;touch-action:none}
body{position:relative}
/* The canvas is placed purely by its transform (see centerCanvas). Flex-centering
   it as well would shift it by (vw-w)/2 a second time and skew the sampling. */
#viewport{position:relative;width:100%;height:100%;overflow:hidden}
#c{position:absolute;left:0;top:0;display:block;transform-origin:0 0}
#loupe{position:fixed;width:110px;height:110px;border-radius:50%;border:3px solid #fff;
  box-shadow:0 2px 16px rgba(0,0,0,0.45);overflow:hidden;pointer-events:none;
  display:none;z-index:10}
#loupe canvas{position:absolute;top:0;left:0}
#crosshair{position:absolute;top:50%;left:50%;width:14px;height:14px;
  border:2px solid #fff;border-radius:50%;transform:translate(-50%,-50%);
  pointer-events:none;box-shadow:0 0 0 1px rgba(0,0,0,0.3)}
</style></head>
<body>
<div id="viewport"><canvas id="c"></canvas></div>
<div id="loupe"><canvas id="lc" width="110" height="110"></canvas><div id="crosshair"></div></div>
<script>
var vp=document.getElementById('viewport');
var canvas=document.getElementById('c'),ctx=canvas.getContext('2d');
var loupe=document.getElementById('loupe'),lCanvas=document.getElementById('lc'),lCtx=lCanvas.getContext('2d');
var LZOOM=4,LSIZE=110;

/* Zoom / pan state */
var scale=1,panX=0,panY=0,baseW=0,baseH=0;
var pinchDist0=0,pinchScale0=1,pinchMid0={x:0,y:0},pinchPan0={x:0,y:0};

var img=new Image();
img.onload=function(){
  canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
  ctx.drawImage(img,0,0);
  /* Fit image to viewport */
  var vw=vp.clientWidth,vh=vp.clientHeight;
  baseW=vw;baseH=Math.round(vw*(img.naturalHeight/img.naturalWidth));
  if(baseH>vh){baseH=vh;baseW=Math.round(vh*(img.naturalWidth/img.naturalHeight));}
  canvas.style.width=baseW+'px';canvas.style.height=baseH+'px';
  centerCanvas();
};
img.src="${eyedropperDataUri}";

function centerCanvas(){
  var vw=vp.clientWidth,vh=vp.clientHeight;
  var w=baseW*scale,h=baseH*scale;
  panX=Math.min(0,Math.max(vw-w,panX));
  panY=Math.min(0,Math.max(vh-h,panY));
  if(w<=vw)panX=(vw-w)/2;
  if(h<=vh)panY=(vh-h)/2;
  canvas.style.transform='translate('+panX+'px,'+panY+'px) scale('+scale+')';
}

function toImageCoords(ex,ey){
  var rect=vp.getBoundingClientRect();
  var vx=ex-rect.left,vy=ey-rect.top;
  var ix=(vx-panX)/(baseW*scale)*canvas.width;
  var iy=(vy-panY)/(baseH*scale)*canvas.height;
  ix=Math.max(0,Math.min(canvas.width-1,Math.round(ix)));
  iy=Math.max(0,Math.min(canvas.height-1,Math.round(iy)));
  return{x:ix,y:iy};
}

function showLoupe(ex,ey,ix,iy){
  /* Always above the finger (below it, the hand hides it). Near the edges it is
     clamped inside the viewport instead of flipping, so it never gets cut off. */
  var vw=window.innerWidth;
  var left=Math.max(4,Math.min(vw-LSIZE-4,ex-LSIZE/2));
  var top=Math.max(4,ey-LSIZE-24);
  loupe.style.display='block';
  loupe.style.left=left+'px';
  loupe.style.top=top+'px';
  lCtx.clearRect(0,0,LSIZE,LSIZE);
  var srcR=LSIZE/LZOOM*(canvas.width/(baseW*scale));
  lCtx.save();
  lCtx.beginPath();lCtx.arc(LSIZE/2,LSIZE/2,LSIZE/2,0,Math.PI*2);lCtx.clip();
  lCtx.drawImage(canvas,ix-srcR/2,iy-srcR/2,srcR,srcR,0,0,LSIZE,LSIZE);
  lCtx.restore();
}

function sampleAt(ex,ey){
  var c=toImageCoords(ex,ey);
  showLoupe(ex,ey,c.x,c.y);
  var p=ctx.getImageData(c.x,c.y,1,1).data;
  var hex='#'+[p[0],p[1],p[2]].map(function(v){return v.toString(16).padStart(2,'0')}).join('').toUpperCase();
  window.ReactNativeWebView.postMessage('PREVIEW:'+hex);
}

function dist(t){var dx=t[0].clientX-t[1].clientX,dy=t[0].clientY-t[1].clientY;return Math.sqrt(dx*dx+dy*dy);}
function mid(t){return{x:(t[0].clientX+t[1].clientX)/2,y:(t[0].clientY+t[1].clientY)/2};}

/* Tool chosen in the native header: 'pick' (eyedropper) or 'pan' (hand). */
var mode='pick';
window.setMode=function(m){mode=m;activeMode=null;loupe.style.display='none';};

var activeMode=null; /* 'pick', 'pan' or 'pinch' — what the current gesture is doing */
var dragStart={x:0,y:0},dragPan0={x:0,y:0};

function startSingle(t){
  if(mode==='pan'){
    activeMode='pan';
    dragStart={x:t.clientX,y:t.clientY};dragPan0={x:panX,y:panY};
  } else {
    activeMode='pick';
    sampleAt(t.clientX,t.clientY);
  }
}

vp.addEventListener('touchstart',function(e){
  e.preventDefault();
  if(e.touches.length===2){
    activeMode='pinch';loupe.style.display='none';
    pinchDist0=dist(e.touches);pinchScale0=scale;
    pinchMid0=mid(e.touches);pinchPan0={x:panX,y:panY};
  } else if(e.touches.length===1){
    startSingle(e.touches[0]);
  }
},{passive:false});

vp.addEventListener('touchmove',function(e){
  e.preventDefault();
  if(activeMode==='pinch'&&e.touches.length===2){
    var d=dist(e.touches);
    var newScale=Math.max(1,Math.min(8,pinchScale0*(d/pinchDist0)));
    var m=mid(e.touches);
    var rect=vp.getBoundingClientRect();
    /* Zoom toward pinch center */
    var cx=pinchMid0.x-rect.left,cy=pinchMid0.y-rect.top;
    panX=m.x-rect.left-cx+(pinchPan0.x-(pinchMid0.x-rect.left))*(newScale/pinchScale0)+(m.x-pinchMid0.x);
    panY=m.y-rect.top-cy+(pinchPan0.y-(pinchMid0.y-rect.top))*(newScale/pinchScale0)+(m.y-pinchMid0.y);
    scale=newScale;
    centerCanvas();
  } else if(e.touches.length===1){
    var t=e.touches[0];
    if(activeMode==='pan'){
      panX=dragPan0.x+(t.clientX-dragStart.x);
      panY=dragPan0.y+(t.clientY-dragStart.y);
      centerCanvas();
    } else if(activeMode==='pick'){
      sampleAt(t.clientX,t.clientY);
    }
  }
},{passive:false});

vp.addEventListener('touchend',function(e){
  if(e.touches.length===0){activeMode=null;loupe.style.display='none';}
  else if(e.touches.length===1&&activeMode==='pinch'){
    /* One finger lifted after a pinch: continue with whatever the tool does */
    startSingle(e.touches[0]);
  }
},{passive:true});
vp.addEventListener('touchcancel',function(){activeMode=null;loupe.style.display='none';},{passive:true});

/* Desktop: click to pick (only with the eyedropper tool) */
vp.addEventListener('click',function(e){
  if(mode!=='pick'||e.target!==canvas)return;
  var c=toImageCoords(e.clientX,e.clientY);
  var p=ctx.getImageData(c.x,c.y,1,1).data;
  var hex='#'+[p[0],p[1],p[2]].map(function(v){return v.toString(16).padStart(2,'0')}).join('').toUpperCase();
  window.ReactNativeWebView.postMessage('PREVIEW:'+hex);
});
</script></body></html>`,
                }}
                ref={eyedropperWebViewRef}
                // The WebView remounts on photo change (key), so re-apply the native tool choice.
                onLoadEnd={() => {
                  eyedropperWebViewRef.current?.injectJavaScript(`window.setMode('${eyedropperTool}');true;`);
                }}
                onMessage={(event) => {
                  const msg = event.nativeEvent.data;
                  if (msg.startsWith("PREVIEW:")) {
                    const hex = msg.slice(8);
                    if (/^#[0-9A-F]{6}$/.test(hex)) {
                      setEyedropperPreviewColor(hex);
                    }
                  }
                }}
                style={{ flex: 1, backgroundColor: theme.colors.bgSecondary }}
                javaScriptEnabled
                scrollEnabled={false}
              />
            ) : (
              <EyedropperSkeleton theme={theme} loading={eyedropperLoading} />
            )}
          </View>

          {/* Preview bar + validate button */}
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
            gap: theme.spacing.sm,
          }}>
            {eyedropperPreviewColor ? (
              <>
                <View style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: eyedropperPreviewColor,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: theme.colors.border,
                }} />
                <Text style={{ flex: 1, color: theme.colors.text, fontSize: theme.typography.size.sm, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" }}>
                  {eyedropperPreviewColor}
                </Text>
                <Pressable
                  onPress={() => {
                    if (eyedropperPreviewColor && !selectedColors.includes(eyedropperPreviewColor) && selectedColors.length < 10) {
                      setSelectedColors((prev) => [...prev, eyedropperPreviewColor]);
                    }
                    setEyedropperPreviewColor(null);
                    setShowEyedropper(false);
                  }}
                  style={{
                    backgroundColor: theme.colors.accent,
                    paddingHorizontal: theme.spacing.lg,
                    paddingVertical: theme.spacing.sm,
                    borderRadius: 999,
                  }}
                >
                  <Text style={{ color: theme.colors.onAccent, fontSize: theme.typography.size.sm, fontWeight: theme.typography.weight.semibold }}>
                    {t("common.validate")}
                  </Text>
                </Pressable>
              </>
            ) : (
              <Text style={{ flex: 1, color: theme.colors.textTertiary, fontSize: theme.typography.size.sm, textAlign: "center" }}>
                {t(eyedropperTool === "pan" ? "spots.panHint" : "spots.dragToPickColor")}
              </Text>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function EyedropperSkeleton({ theme, loading }: { theme: Theme; loading: boolean }) {
  const { t } = useTranslation();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (!loading) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [loading, opacity]);

  if (!loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name="alert-circle-outline" size={28} color={theme.colors.textTertiary} />
        <Text style={{ color: theme.colors.textSecondary, fontSize: theme.typography.size.sm, marginTop: theme.spacing.xs }}>
          {t("common.error")}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: theme.spacing.lg }}>
      {/* Main image skeleton */}
      <Animated.View
        style={{
          flex: 1,
          borderRadius: theme.radius.sm,
          backgroundColor: theme.colors.bgTertiary,
          opacity,
        }}
      />
      {/* Bottom bar skeleton */}
      <View style={{ flexDirection: "row", marginTop: theme.spacing.sm, gap: theme.spacing.sm }}>
        <Animated.View style={{ width: 48, height: 12, borderRadius: 6, backgroundColor: theme.colors.bgTertiary, opacity }} />
        <View style={{ flex: 1 }} />
        <Animated.View style={{ width: 32, height: 12, borderRadius: 6, backgroundColor: theme.colors.bgTertiary, opacity }} />
      </View>
    </View>
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
