"use client";

import { startTransition, use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import type { Spot, SpotPhoto, SpotImage } from "@/lib/api-client";
import { ACCEPTED_IMAGE_TYPES, MAX_PHOTO_SIZE_BYTES } from "@trs/shared/constants";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/lib/use-t";

const MiniMap = dynamic(() => import("@/components/mini-map"), { ssr: false });

// ─── Image Carousel ─────────────────────────────────────────────────

function ImageCarousel({
  images,
  fallbackUrl,
  alt,
  aspectClass,
}: {
  images: SpotImage[];
  fallbackUrl: string;
  alt: string;
  aspectClass?: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const hasMultiple = images.length > 1;

  useEffect(() => {
    if (!hasMultiple) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
      } else if (e.key === "ArrowRight") {
        setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
      }
    }

    const container = containerRef.current;
    container?.addEventListener("keydown", handleKeyDown);
    return () => container?.removeEventListener("keydown", handleKeyDown);
  }, [hasMultiple, images.length]);

  if (images.length === 0) {
    return (
      <div className={`${aspectClass ?? "aspect-square sm:aspect-[4/3]"} bg-bg-secondary overflow-hidden`}>
        <img src={fallbackUrl} alt={alt} className="h-full w-full object-cover" />
      </div>
    );
  }

  if (!hasMultiple) {
    return (
      <div className={`${aspectClass ?? "aspect-square sm:aspect-[4/3]"} bg-bg-secondary overflow-hidden`}>
        <img src={images[0].photoUrl} alt={alt} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className={`relative ${aspectClass ?? "aspect-square sm:aspect-[4/3]"} bg-bg-secondary overflow-hidden group focus:outline-none`}
    >
      <img
        src={images[currentIndex].photoUrl}
        alt={alt}
        className="h-full w-full object-cover transition-opacity duration-200"
      />

      {/* Left arrow */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
        }}
        className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-sm bg-bg/60 backdrop-blur-sm text-text hover:bg-bg/80 transition-all opacity-0 group-hover:opacity-100 cursor-pointer border border-border/40"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>

      {/* Right arrow */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-sm bg-bg/60 backdrop-blur-sm text-text hover:bg-bg/80 transition-all opacity-0 group-hover:opacity-100 cursor-pointer border border-border/40"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>

      {/* Counter badge */}
      <span className="absolute top-3 right-3 px-2 py-0.5 text-xs font-medium bg-bg/60 backdrop-blur-sm text-text rounded-sm border border-border/40">
        {currentIndex + 1}/{images.length}
      </span>

      {/* Dots indicator */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
        {images.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCurrentIndex(i);
            }}
            className={`rounded-full transition-all cursor-pointer ${
              i === currentIndex
                ? "h-2 w-2 bg-white"
                : "h-1.5 w-1.5 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default function SpotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const t = useT();

  const [spot, setSpot] = useState<Spot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Community photos state
  const [photos, setPhotos] = useState<SpotPhoto[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [photosCursor, setPhotosCursor] = useState<string | null>(null);
  const [showAddPhoto, setShowAddPhoto] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [uploadMessage, setUploadMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const loadSpot = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.spots.get(id);
      setSpot(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const loadPhotos = useCallback(
    async (cursor?: string) => {
      setPhotosLoading(true);
      try {
        const result = await apiClient.spots.listPhotos(id, cursor);
        setPhotos((prev) =>
          cursor ? [...prev, ...result.items] : result.items,
        );
        setPhotosCursor(result.nextCursor);
      } catch {
        // Silently fail — not critical
      } finally {
        setPhotosLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    startTransition(() => {
      loadSpot();
      loadPhotos();
    });
  }, [loadSpot, loadPhotos]);

  async function handleDelete() {
    if (!spot) return;
    if (!window.confirm(t("spots.deleteConfirm"))) return;

    try {
      await apiClient.spots.delete(spot.id);
      router.push("/map");
    } catch {
      // Show error
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setUploadMessage({ type: "error", text: t("settings.avatarHint") });
      return;
    }
    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      setUploadMessage({ type: "error", text: t("settings.avatarHint") });
      return;
    }

    setIsUploading(true);
    setUploadMessage(null);

    try {
      const newPhoto = await apiClient.spots.uploadPhoto(
        id,
        file,
        caption || undefined,
      );
      setPhotos((prev) => [newPhoto, ...prev]);
      setCaption("");
      setShowAddPhoto(false);
      setUploadMessage({ type: "success", text: t("spotPhotos.photoAdded") });
    } catch (err) {
      setUploadMessage({
        type: "error",
        text: err instanceof Error ? err.message : t("common.error"),
      });
    } finally {
      setIsUploading(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Skeleton className="aspect-[16/10] w-full" />
        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-20 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !spot) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-error">{error ?? t("users.notFound")}</p>
        <Button variant="secondary" onClick={() => router.back()}>
          {t("common.back")}
        </Button>
      </div>
    );
  }

  const isOwner = user?.id === spot.userId;

  // Build images array for the carousel
  const carouselImages: SpotImage[] =
    spot.images && spot.images.length > 0
      ? spot.images
      : [{ id: "cover", photoUrl: spot.photoUrl, photoKey: "", order: 0 }];

  return (
    <div className="mx-auto max-w-5xl px-0 sm:px-4 py-0 sm:py-6">
      {/* Instagram-style post layout */}
      <div className="sm:border sm:border-border sm:rounded-md overflow-hidden bg-bg">
        {/* User header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          {spot.user ? (
            <Link
              href={`/profile/${spot.user.username}`}
              className="flex items-center gap-3 group"
            >
              {spot.user.avatarUrl ? (
                <img
                  src={spot.user.avatarUrl}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white text-xs font-semibold">
                  {spot.user.name?.charAt(0)?.toUpperCase() ?? "?"}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-text group-hover:text-text-secondary transition-colors">
                  {spot.user.username}
                </p>
                {spot.city || spot.country ? (
                  <p className="text-xs text-text-tertiary">
                    {[spot.city, spot.country].filter(Boolean).join(", ")}
                  </p>
                ) : null}
              </div>
            </Link>
          ) : null}

          {isOwner ? (
            <button
              onClick={handleDelete}
              className="p-2 text-text-tertiary hover:text-error transition-colors cursor-pointer"
              title={t("common.delete")}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </button>
          ) : null}
        </div>

        {/* Photo carousel */}
        <ImageCarousel
          images={carouselImages}
          fallbackUrl={spot.photoUrl}
          alt={spot.title ?? ""}
        />

        {/* Details below photo */}
        <div className="px-4 py-4 space-y-4">
          {/* Title + description */}
          {spot.title ? (
            <p className="text-sm">
              {spot.user ? (
                <span className="font-semibold text-text">{spot.user.username}</span>
              ) : null}
              {spot.user ? " " : null}
              <span className="text-text">{spot.title}</span>
            </p>
          ) : null}

          {spot.description ? (
            <p className="text-sm text-text-secondary leading-relaxed">
              {spot.description}
            </p>
          ) : null}

          {/* Compositions */}
          {spot.compositions.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {spot.compositions.map((c) => (
                <span
                  key={c}
                  className="inline-block px-2.5 py-1 text-xs bg-sage/10 text-sage border border-sage/20 rounded-sm"
                >
                  {t(`compositions.${c}`)}
                </span>
              ))}
              {spot.customComposition ? (
                <span className="inline-block px-2.5 py-1 text-xs bg-bg-secondary text-text-secondary border border-border rounded-sm italic">
                  {spot.customComposition}
                </span>
              ) : null}
            </div>
          ) : null}

          {/* Tags */}
          {spot.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {spot.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-block px-2.5 py-1 text-xs bg-bg-secondary text-text-secondary border border-border rounded-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          {/* Colors */}
          {spot.colors.length > 0 ? (
            <div className="flex gap-2">
              {spot.colors.map((color) => (
                <div
                  key={color}
                  className="h-6 w-6 rounded-full border border-border"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          ) : null}

          {/* Visibility */}
          <div className="flex items-center gap-2 text-sm">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-medium ${
              spot.visibility === "PRIVATE"
                ? "bg-accent/10 text-accent border border-accent/20"
                : "bg-sage/10 text-sage border border-sage/20"
            }`}>
              {spot.visibility === "PRIVATE" ? (
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              ) : (
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                </svg>
              )}
              {spot.visibility === "PRIVATE" ? t("spots.visibilityPrivate") : t("spots.visibilityFollowers")}
            </span>
          </div>
        </div>

        {/* Mini map */}
        <div className="border-t border-border">
          <div className="h-40 sm:h-48">
            <MiniMap latitude={spot.latitude} longitude={spot.longitude} />
          </div>
          <div className="px-4 py-2 border-t border-border flex items-center justify-between">
            <p className="text-xs text-text-tertiary font-mono">
              {spot.latitude.toFixed(6)}, {spot.longitude.toFixed(6)}
            </p>
            {spot.address ? (
              <p className="text-xs text-text-tertiary truncate ml-4">
                {spot.address}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── Community Photos Section ─────────────────────────────── */}
      <div className="mt-6 sm:mt-8">
        <div className="flex items-center justify-between px-4 sm:px-0 mb-4">
          <h2 className="text-base font-semibold text-text">
            {t("spotPhotos.title")}
          </h2>
          {user ? (
            <button
              type="button"
              onClick={() => setShowAddPhoto(!showAddPhoto)}
              className="flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-accent-dark transition-colors cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              {t("spotPhotos.addPhoto")}
            </button>
          ) : null}
        </div>

        {/* Upload form */}
        {showAddPhoto ? (
          <div className="px-4 sm:px-0 mb-6">
            <div className="border border-border rounded-md bg-bg-secondary p-4 space-y-3">
              <input
                ref={photoInputRef}
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(",")}
                onChange={handlePhotoUpload}
                disabled={isUploading}
                className="block w-full text-sm text-text-secondary
                  file:mr-3 file:py-2 file:px-4
                  file:rounded file:border-0
                  file:text-sm file:font-semibold
                  file:bg-accent file:text-white
                  file:cursor-pointer
                  hover:file:bg-accent-dark
                  disabled:opacity-50"
              />
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder={t("spotPhotos.captionPlaceholder")}
                maxLength={500}
                className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
              />
              {isUploading ? (
                <p className="text-sm text-text-tertiary flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t("spotPhotos.uploading")}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Upload message */}
        {uploadMessage ? (
          <p className={`px-4 sm:px-0 mb-4 text-sm ${
            uploadMessage.type === "success" ? "text-success" : "text-error"
          }`}>
            {uploadMessage.text}
          </p>
        ) : null}

        {/* Photos grid */}
        {photos.length > 0 ? (
          <div className="grid grid-cols-3 gap-0.5 sm:gap-1">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="aspect-square overflow-hidden bg-bg-secondary group relative"
              >
                <img
                  src={photo.photoUrl}
                  alt={photo.caption ?? ""}
                  className="h-full w-full object-cover"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center p-2">
                  <p className="text-white text-xs font-semibold">
                    {photo.user.username}
                  </p>
                  {photo.caption ? (
                    <p className="text-white/80 text-xs mt-1 text-center line-clamp-2">
                      {photo.caption}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : !photosLoading ? (
          <p className="px-4 sm:px-0 py-8 text-center text-sm text-text-tertiary">
            {t("spotPhotos.noPhotos")}
          </p>
        ) : null}

        {/* Loading */}
        {photosLoading ? (
          <div className="flex justify-center py-8">
            <svg className="h-6 w-6 animate-spin text-text-tertiary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : null}

        {/* Load more */}
        {photosCursor ? (
          <div className="flex justify-center py-6">
            <Button
              variant="secondary"
              onClick={() => loadPhotos(photosCursor)}
              loading={photosLoading}
            >
              {t("common.next")}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
