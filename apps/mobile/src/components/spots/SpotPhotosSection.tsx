import React, { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { File } from "expo-file-system";
import { useTranslation } from "react-i18next";
import { MAX_POST_PHOTOS } from "@trs/shared/mentions";
import { MAX_POST_BYTES } from "@trs/shared/constants";
import { useTheme } from "../../theme";
import { useAuthStore } from "../../stores/auth-store";
import { addSpotPhoto, deleteSpotPhoto, getSpotPhotos, type OutgoingPhoto } from "../../lib/api";
import { extractErrorMessage } from "../../lib/error";
import { confirmDialog, noticeDialog } from "../../stores/dialog-store";
import { Button } from "../ui/Button";
import { UploadProgress } from "../ui/UploadProgress";
import { CommunityPost } from "./CommunityPost";
import { MentionInput } from "./MentionInput";
import { PhotoLightbox } from "./PhotoLightbox";
import type { SpotPhoto } from "../../types";

interface SpotPhotosSectionProps {
  spotId: string;
  /** The spot's author — they may remove any community post. */
  ownerId: string;
}

/**
 * How a posted photo is shrunk. The server re-encodes anyway; doing it
 * here keeps a 12 MP phone photo off a mobile network — and keeps the
 * whole post under the request body the platform accepts, which it
 * otherwise refuses with a bare 413. Each pass draws them smaller.
 */
const PASSES = [
  { maxEdge: 2560, quality: 0.82 },
  { maxEdge: 1800, quality: 0.75 },
  { maxEdge: 1280, quality: 0.68 },
];

/**
 * What the community posted under a spot: each post its author, its text
 * and its photos fanned out, plus the flow to add one — several photos at
 * a time, a caption that can name people with an `@`.
 */
export function SpotPhotosSection({ spotId, ownerId }: SpotPhotosSectionProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const user = useAuthStore((s) => s.user);

  const [photos, setPhotos] = useState<SpotPhoto[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  /** Which post is open in the lightbox, and at which of its photos. */
  const [openPost, setOpenPost] = useState<{ id: string; index: number } | null>(null);
  const [pending, setPending] = useState<OutgoingPhoto[]>([]);
  const [isComposing, setIsComposing] = useState(false);
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  /** How much of the post has gone out, 0 → 1. */
  const [uploadProgress, setUploadProgress] = useState(0);
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
      // Leave what is already on screen
    } finally {
      setIsLoadingMore(false);
    }
  };

  /** Shrink and re-encode before the photo ever leaves the phone. */
  const prepare = async (
    uri: string,
    fileName: string,
    pass: (typeof PASSES)[number],
  ): Promise<OutgoingPhoto> => {
    try {
      const ctx = ImageManipulator.manipulate(uri);
      ctx.resize({ width: pass.maxEdge });
      const rendered = await ctx.renderAsync();
      const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: pass.quality });
      return { uri: saved.uri, fileName };
    } catch {
      // A photo the phone cannot re-encode still goes up as it is
      return { uri, fileName };
    }
  };

  /** What a prepared photo weighs, as the file system has it. */
  const weigh = (photo: OutgoingPhoto): number => {
    try {
      return new File(photo.uri).size ?? 0;
    } catch {
      return 0;
    }
  };

  /**
   * Every photo of the post, shrunk enough for the post to fit on the
   * wire. If even the last pass is too heavy the photographer is told,
   * rather than left with a 413 from the platform.
   */
  const prepareAll = async (
    assets: { uri: string; fileName: string }[],
  ): Promise<OutgoingPhoto[]> => {
    let prepared: OutgoingPhoto[] = [];
    for (const pass of PASSES) {
      prepared = await Promise.all(assets.map((a) => prepare(a.uri, a.fileName, pass)));
      const total = prepared.reduce((sum, photo) => sum + weigh(photo), 0);
      // A file system that will not answer leaves us with 0: take the pass
      if (total <= MAX_POST_BYTES) return prepared;
    }
    throw new Error(t("spotPhotos.tooHeavy"));
  };

  const pickPhotos = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: MAX_POST_PHOTOS,
      quality: 1,
    });
    if (result.canceled || result.assets.length === 0) return;

    try {
      const chosen = await prepareAll(
        result.assets.slice(0, MAX_POST_PHOTOS).map((asset, i) => ({
          uri: asset.uri,
          fileName: asset.fileName ?? `photo-${Date.now()}-${i}.jpg`,
        })),
      );
      setPending(chosen);
      setCaption("");
      setIsComposing(true);
    } catch (err) {
      void noticeDialog({ title: t("common.error"), message: extractErrorMessage(err, t("common.error")) });
    }
  };

  const submitPost = async () => {
    if (pending.length === 0) return;
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const post = await addSpotPhoto(
        spotId,
        pending,
        caption.trim() || undefined,
        setUploadProgress,
      );
      setPhotos((prev) => [post, ...prev]);
      setPending([]);
      setCaption("");
      setIsComposing(false);
    } catch (err) {
      void noticeDialog({ title: t("common.error"), message: extractErrorMessage(err, t("common.error")) });
    } finally {
      setIsUploading(false);
    }
  };

  const removePost = async (post: SpotPhoto) => {
    setDeletingId(post.id);
    try {
      await deleteSpotPhoto(spotId, post.id);
      setPhotos((prev) => prev.filter((p) => p.id !== post.id));
      setOpenPost((current) => (current?.id === post.id ? null : current));
    } catch (err) {
      void noticeDialog({ title: t("common.error"), message: extractErrorMessage(err, t("common.error")) });
    } finally {
      setDeletingId(null);
    }
  };

  const confirmDelete = (post: SpotPhoto) => {
    void confirmDialog({
      title: t("spotPhotos.deletePhoto"),
      message: t("spotPhotos.deleteConfirm"),
      confirmLabel: t("common.delete"),
      destructive: true,
    }).then((sure) => {
      if (sure) void removePost(post);
    });
  };

  const canDelete = (post: SpotPhoto) =>
    !!user && (user.id === post.user.id || user.id === ownerId);

  /** The photos of the post the lightbox is showing, if it is still here. */
  const openImages =
    photos.find((post) => post.id === openPost?.id)?.images.map((image) => image.photoUrl) ?? [];
  const openIndex = openPost ? Math.min(openPost.index, Math.max(openImages.length - 1, 0)) : 0;

  return (
    <View>
      <View style={styles.headerRow}>
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontSize: theme.typography.size.xs,
            letterSpacing: 0.5,
            textTransform: "uppercase",
          }}
        >
          {t("spotPhotos.title")}
        </Text>
        <Pressable
          onPress={() => void pickPhotos()}
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
        <View>
          {photos.map((post) => (
            <View key={post.id} style={[styles.divider, { borderTopColor: theme.colors.border }]}>
              <CommunityPost
                post={post}
                canDelete={canDelete(post)}
                isDeleting={deletingId === post.id}
                onDelete={() => confirmDelete(post)}
                onOpenPhoto={(index) => setOpenPost({ id: post.id, index })}
              />
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

      {/* A post's photos, over everything */}
      <PhotoLightbox
        uri={openImages.length > 0 ? openImages[openIndex] : null}
        uris={openImages}
        index={openIndex}
        onIndexChange={(index) => setOpenPost((current) => (current ? { ...current, index } : current))}
        onClose={() => setOpenPost(null)}
      />

      {/* Compose: the photos picked, a caption, then post */}
      <Modal
        visible={isComposing}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsComposing(false)}
      >
        <View
          style={[
            styles.addSheet,
            { backgroundColor: theme.colors.bg, padding: theme.spacing.xl, gap: theme.spacing.lg },
          ]}
        >
          <View style={styles.thumbs}>
            {pending.map((photo, i) => (
              <View key={`${photo.uri}-${i}`} style={[styles.thumb, { borderRadius: theme.radius.md }]}>
                <Image source={{ uri: photo.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                <Pressable
                  onPress={() => setPending((prev) => prev.filter((_, at) => at !== i))}
                  hitSlop={6}
                  style={styles.thumbRemove}
                  accessibilityRole="button"
                  accessibilityLabel={t("spotPhotos.removePhoto")}
                  testID={`remove-pending-${i}`}
                >
                  <Ionicons name="close" size={12} color="#FFFFFF" />
                </Pressable>
              </View>
            ))}
          </View>

          <Text style={{ color: theme.colors.textTertiary, fontSize: theme.typography.size.xs }}>
            {pending.length > 0
              ? t("spotPhotos.photosChosen", { count: pending.length })
              : t("spotPhotos.maxPhotos", { count: MAX_POST_PHOTOS })}
          </Text>

          <MentionInput
            label={t("spotPhotos.caption")}
            value={caption}
            onChangeText={setCaption}
            maxLength={500}
            editable={!isUploading}
            testID="spot-photo-caption"
          />

          {isUploading ? (
            <UploadProgress
              value={uploadProgress}
              label={t("spotPhotos.uploading")}
              testID="upload-progress"
            />
          ) : null}

          <Button
            title={t("spotPhotos.post")}
            onPress={() => void submitPost()}
            loading={isUploading}
            disabled={pending.length === 0}
            testID="submit-spot-photo"
          />
          <Button
            title={t("common.cancel")}
            variant="ghost"
            onPress={() => setIsComposing(false)}
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
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  addSheet: {
    flex: 1,
  },
  thumbs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  thumb: {
    width: 72,
    height: 72,
    overflow: "hidden",
    backgroundColor: "rgba(22,32,58,0.06)",
  },
  thumbRemove: {
    position: "absolute",
    top: 3,
    right: 3,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
});
