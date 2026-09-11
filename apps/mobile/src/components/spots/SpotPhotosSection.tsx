import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../theme";
import { useAuthStore } from "../../stores/auth-store";
import { addSpotPhoto, deleteSpotPhoto, getSpotPhotos } from "../../lib/api";
import { extractErrorMessage } from "../../lib/error";
import { Avatar } from "../Avatar";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import type { SpotPhoto } from "../../types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const COLUMNS = 3;
const GRID_GAP = 2;
/** The grid is full-bleed, three squares with a hairline gutter, like the profile. */
const TILE = (SCREEN_WIDTH - GRID_GAP * (COLUMNS - 1)) / COLUMNS;

interface SpotPhotosSectionProps {
  spotId: string;
  /** The spot's author — they may remove any community photo. */
  ownerId: string;
}

/**
 * Photos other users added under a spot: a grid, an "add your photo" flow
 * with a caption, and deletion by the photo's author or the spot's owner.
 * Tapping a tile opens a preview with the author and caption — the mobile
 * stand-in for the web's hover overlay.
 */
export function SpotPhotosSection({ spotId, ownerId }: SpotPhotosSectionProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const user = useAuthStore((s) => s.user);

  const [photos, setPhotos] = useState<SpotPhoto[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [preview, setPreview] = useState<SpotPhoto | null>(null);
  const [pending, setPending] = useState<{ uri: string; fileName: string } | null>(null);
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSpotPhotos(spotId)
      .then((page) => {
        if (cancelled) return;
        setPhotos(page.items);
        setNextCursor(page.nextCursor);
      })
      .catch(() => {
        // Not critical — the spot itself still renders.
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [spotId]);

  const loadMore = async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const page = await getSpotPhotos(spotId, nextCursor);
      setPhotos((prev) => [...prev, ...page.items]);
      setNextCursor(page.nextCursor);
    } catch {
      // Keep what we have.
    } finally {
      setIsLoadingMore(false);
    }
  };

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    const asset = result.canceled ? null : result.assets[0];
    if (!asset) return;
    setCaption("");
    setPending({ uri: asset.uri, fileName: asset.fileName ?? `photo-${Date.now()}.jpg` });
  };

  const submitPhoto = async () => {
    if (!pending) return;
    setIsUploading(true);
    try {
      const photo = await addSpotPhoto(
        spotId,
        pending.uri,
        caption.trim() || undefined,
        pending.fileName,
      );
      setPhotos((prev) => [photo, ...prev]);
      setPending(null);
    } catch (err) {
      Alert.alert(t("common.error"), extractErrorMessage(err, t("common.error")));
    } finally {
      setIsUploading(false);
    }
  };

  const removePhoto = async (photo: SpotPhoto) => {
    setDeletingId(photo.id);
    try {
      await deleteSpotPhoto(spotId, photo.id);
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      setPreview((current) => (current?.id === photo.id ? null : current));
    } catch (err) {
      Alert.alert(t("common.error"), extractErrorMessage(err, t("common.error")));
    } finally {
      setDeletingId(null);
    }
  };

  const confirmDelete = (photo: SpotPhoto) => {
    Alert.alert(t("spotPhotos.deletePhoto"), t("spotPhotos.deleteConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("common.delete"), style: "destructive", onPress: () => void removePhoto(photo) },
    ]);
  };

  const canDelete = (photo: SpotPhoto) =>
    !!user && (user.id === photo.userId || user.id === ownerId);

  return (
    <View>
      {/* Header row: label + add */}
      <View style={styles.headerRow}>
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontSize: theme.typography.size.xs,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {t("spotPhotos.title")}
        </Text>
        <Pressable
          onPress={() => void pickPhoto()}
          hitSlop={8}
          style={styles.addButton}
          accessibilityRole="button"
          testID="add-spot-photo"
        >
          <Ionicons name="add" size={18} color={theme.colors.accent} />
          <Text
            style={{
              color: theme.colors.accent,
              fontSize: theme.typography.size.sm,
              fontWeight: theme.typography.weight.semibold,
            }}
          >
            {t("spotPhotos.addPhoto")}
          </Text>
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator color={theme.colors.textSecondary} style={styles.loader} />
      ) : photos.length === 0 ? (
        <Text
          style={[
            styles.empty,
            { color: theme.colors.textTertiary, fontSize: theme.typography.size.sm },
          ]}
        >
          {t("spotPhotos.noPhotos")}
        </Text>
      ) : (
        <View style={[styles.grid, { marginHorizontal: -theme.spacing.lg }]}>
          {photos.map((photo) => (
            <View key={photo.id} style={styles.tile}>
              <Pressable
                onPress={() => setPreview(photo)}
                style={StyleSheet.absoluteFill}
                accessibilityRole="imagebutton"
                accessibilityLabel={photo.caption ?? photo.user.username}
                testID={`spot-photo-${photo.id}`}
              >
                <Image
                  source={{ uri: photo.photoUrl }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                />
              </Pressable>
              {canDelete(photo) ? (
                <Pressable
                  onPress={() => confirmDelete(photo)}
                  disabled={deletingId === photo.id}
                  hitSlop={6}
                  style={styles.deleteButton}
                  accessibilityRole="button"
                  accessibilityLabel={t("spotPhotos.deletePhoto")}
                  testID={`delete-spot-photo-${photo.id}`}
                >
                  <Ionicons name="trash-outline" size={14} color="#FFFFFF" />
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      )}

      {nextCursor ? (
        <Button
          title={t("common.next")}
          variant="ghost"
          onPress={() => void loadMore()}
          loading={isLoadingMore}
          style={{ marginTop: theme.spacing.md }}
        />
      ) : null}

      {/* Preview: author + caption over the photo */}
      <Modal
        visible={preview !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setPreview(null)}
      >
        <Pressable style={styles.previewBackdrop} onPress={() => setPreview(null)}>
          {preview ? (
            <View style={styles.previewCard}>
              <Image
                source={{ uri: preview.photoUrl }}
                style={styles.previewImage}
                resizeMode="contain"
              />
              <View style={styles.previewMeta}>
                <Avatar url={preview.user.avatarUrl} name={preview.user.name} size={28} />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: theme.typography.size.sm,
                      fontWeight: theme.typography.weight.semibold,
                    }}
                  >
                    {preview.user.username}
                  </Text>
                  {preview.caption ? (
                    <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: theme.typography.size.sm }}>
                      {preview.caption}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>
          ) : null}
        </Pressable>
      </Modal>

      {/* Add photo: the picked image and a caption, then upload */}
      <Modal
        visible={pending !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPending(null)}
      >
        <View
          style={[
            styles.addSheet,
            { backgroundColor: theme.colors.bg, padding: theme.spacing.xl, gap: theme.spacing.lg },
          ]}
        >
          {pending ? (
            <Image
              source={{ uri: pending.uri }}
              style={[styles.addPreview, { borderRadius: theme.radius.lg }]}
              resizeMode="cover"
            />
          ) : null}
          <Input
            label={t("spotPhotos.caption")}
            placeholder={t("spotPhotos.captionPlaceholder")}
            value={caption}
            onChangeText={setCaption}
            maxLength={500}
            multiline
            testID="spot-photo-caption"
          />
          <Button
            title={isUploading ? t("spotPhotos.uploading") : t("spotPhotos.addPhoto")}
            onPress={() => void submitPhoto()}
            loading={isUploading}
            testID="submit-spot-photo"
          />
          <Button
            title={t("common.cancel")}
            variant="ghost"
            onPress={() => setPending(null)}
            disabled={isUploading}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  loader: {
    paddingVertical: 32,
  },
  empty: {
    textAlign: "center",
    paddingVertical: 32,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
  },
  tile: {
    width: TILE,
    height: TILE,
  },
  deleteButton: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  previewBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
  },
  previewCard: {
    width: "100%",
  },
  previewImage: {
    width: "100%",
    aspectRatio: 1,
  },
  previewMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
  },
  addSheet: {
    flex: 1,
  },
  addPreview: {
    width: "100%",
    aspectRatio: 1,
  },
});
