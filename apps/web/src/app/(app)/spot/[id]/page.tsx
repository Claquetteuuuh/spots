"use client";

import { startTransition, use, useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import type { Spot, SpotPhoto, SpotImage } from "@/lib/api-client";
import { ACCEPTED_IMAGE_TYPES, MAX_PHOTO_SIZE_BYTES } from "@trs/shared/constants";
import { useAuth } from "@/lib/auth-context";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/lib/use-t";
import { PAGE_WIDE, PageHeader } from "@/components/page";

const MiniMap = dynamic(() => import("@/components/mini-map"), { ssr: false });

/** Minimum horizontal travel for a touch to count as a swipe between photos. */
const SWIPE_THRESHOLD_PX = 40;

// ─── Image Carousel ─────────────────────────────────────────────────

/**
 * The spot's photos. Below `lg` it is the app's carousel: a square,
 * edge-to-edge, swiped with a finger, with the page dots in their own row
 * under the photo and a dark counter chip in the corner. From `lg` it keeps
 * the desktop card: 4:3, hover arrows, dots overlaid on the photo.
 */
function ImageCarousel({
  images,
  fallbackUrl,
  alt,
}: {
  images: SpotImage[];
  fallbackUrl: string;
  alt: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

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

  const frameClass = "aspect-square lg:aspect-[4/3] bg-bg-secondary overflow-hidden";

  if (images.length === 0) {
    return (
      <div className={frameClass}>
        <img src={fallbackUrl} alt={alt} className="h-full w-full object-cover" />
      </div>
    );
  }

  if (!hasMultiple) {
    return (
      <div className={frameClass}>
        <img src={images[0].photoUrl} alt={alt} className="h-full w-full object-cover" />
      </div>
    );
  }

  const arrowClass =
    "absolute top-1/2 -translate-y-1/2 hidden lg:flex h-8 w-8 items-center justify-center rounded-lg bg-bg/60 backdrop-blur-sm text-text hover:bg-bg/80 transition-all opacity-0 group-hover:opacity-100 cursor-pointer border border-border/40";

  return (
    <div>
      <div
        ref={containerRef}
        tabIndex={0}
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          const start = touchStartX.current;
          touchStartX.current = null;
          if (start === null) return;
          const dx = (e.changedTouches[0]?.clientX ?? start) - start;
          if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
          // A swipe stops at the ends, like the app's paging list.
          setCurrentIndex((prev) =>
            dx < 0 ? Math.min(prev + 1, images.length - 1) : Math.max(prev - 1, 0),
          );
        }}
        className={`relative ${frameClass} group touch-pan-y focus:outline-none`}
      >
        <img
          src={images[currentIndex].photoUrl}
          alt={alt}
          className="h-full w-full object-cover transition-opacity duration-200"
        />

        {/* Arrows — pointer-only, so desktop only */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
          }}
          className={`left-2 ${arrowClass}`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
          }}
          className={`right-2 ${arrowClass}`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>

        {/* Counter chip: the app's dark chip below lg, the desktop glass chip above */}
        <span className="absolute top-3 right-3 rounded-sm bg-black/50 px-2 py-1 text-xs font-semibold text-white lg:rounded-lg lg:border lg:border-border/40 lg:bg-bg/60 lg:py-0.5 lg:font-medium lg:text-text lg:backdrop-blur-sm">
          {currentIndex + 1}/{images.length}
        </span>

        {/* Desktop dots, overlaid on the photo */}
        <div className="absolute bottom-3 left-1/2 hidden -translate-x-1/2 items-center gap-1.5 lg:flex">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCurrentIndex(i);
              }}
              aria-label={`${i + 1}/${images.length}`}
              className={`rounded-full transition-all cursor-pointer ${
                i === currentIndex
                  ? "h-2 w-2 bg-white"
                  : "h-1.5 w-1.5 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      </div>

      {/* App dots, in their own row under the photo */}
      <div className="flex items-center justify-center gap-1.5 py-2.5 lg:hidden">
        {images.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCurrentIndex(i)}
            aria-label={`${i + 1}/${images.length}`}
            className={`h-1.5 w-1.5 rounded-full transition-colors ${
              i === currentIndex ? "bg-accent" : "bg-border"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/** The app's 12px uppercase label above a group of chips. */
function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs uppercase tracking-[0.5px] text-text-secondary">{children}</p>
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
  const [mapExpanded, setMapExpanded] = useState(false);

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
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
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

  async function handleDeletePhoto(photo: SpotPhoto) {
    if (!window.confirm(t("spotPhotos.deleteConfirm"))) return;
    setDeletingPhotoId(photo.id);
    try {
      await apiClient.spots.deletePhoto(id, photo.id);
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    } catch (err) {
      setUploadMessage({
        type: "error",
        text: err instanceof Error ? err.message : t("common.error"),
      });
    } finally {
      setDeletingPhotoId(null);
    }
  }

  if (isLoading) {
    return (
      <div className={`${PAGE_WIDE} pb-6`}>
        <PageHeader title={t("spots.details")} />
        {/* Same shape as the loaded screen: a square photo, then the text block */}
        <div className="-mx-4 lg:mx-0">
          <Skeleton className="aspect-square rounded-none lg:aspect-[4/3] lg:rounded-2xl" />
        </div>
        <div className="space-y-3 py-4">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-3.5 w-1/3" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  if (error || !spot) {
    return (
      <div className={`${PAGE_WIDE} pb-6`}>
        <PageHeader title={t("spots.details")} />
        <div className="flex flex-col items-center justify-center gap-4 py-24">
          <p className="text-center text-[15px] text-error">{error ?? t("users.notFound")}</p>
          <Button variant="secondary" onClick={() => router.back()}>
            {t("common.back")}
          </Button>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === spot.userId;

  // Build images array for the carousel
  const carouselImages: SpotImage[] =
    spot.images && spot.images.length > 0
      ? spot.images
      : [{ id: "cover", photoUrl: spot.photoUrl, photoKey: "", order: 0 }];

  // City and country, else the address, else the raw coordinates — as in the app.
  const locationLabel =
    [spot.city, spot.country].filter(Boolean).join(", ") ||
    spot.address ||
    `${spot.latitude.toFixed(4)}, ${spot.longitude.toFixed(4)}`;

  const coordsLabel = `${spot.latitude.toFixed(6)}, ${spot.longitude.toFixed(6)}`;

  return (
    <div className={`${PAGE_WIDE} pb-6`}>
      <PageHeader title={t("spots.details")} />

      {/* Below lg the screen is the app's: photo edge to edge, no card. From lg
          it is the desktop post card. */}
      <div className="-mx-4 flex flex-col overflow-hidden bg-bg lg:mx-0 lg:rounded-2xl lg:border lg:border-border">
        {/* Photo carousel */}
        <ImageCarousel
          images={carouselImages}
          fallbackUrl={spot.photoUrl}
          alt={spot.title ?? ""}
        />

        {/* Author row — web only (the app has no author row or delete here).
            Under the photo like a caption; above it on desktop, as today. */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3 lg:order-first">
          {spot.user ? (
            <Link
              href={`/profile/${spot.user.username}`}
              className="flex items-center gap-3 group"
            >
              <Avatar url={spot.user.avatarUrl} name={spot.user.name} size={32} />
              <p className="text-sm font-semibold text-text group-hover:text-text-secondary transition-colors">
                {spot.user.username}
              </p>
            </Link>
          ) : (
            <span />
          )}

          {isOwner ? (
            <button
              type="button"
              onClick={handleDelete}
              className="-mr-2 cursor-pointer rounded-full p-2 text-text-tertiary transition-colors hover:text-error"
              title={t("common.delete")}
              aria-label={t("common.delete")}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </button>
          ) : null}
        </div>

        {/* Details below photo — 16px padding, 16px between groups, like the app */}
        <div className="space-y-4 px-4 py-4">
          {/* Title + location */}
          <div>
            <h2 className="text-lg font-bold text-text">
              {spot.title || t("spots.spotTitle")}
            </h2>
            <p className="mt-1 text-[13px] text-text-secondary">{locationLabel}</p>
          </div>

          {/* Description */}
          {spot.description ? (
            <p className="text-[15px] leading-relaxed text-text">{spot.description}</p>
          ) : null}

          {/* Compositions */}
          {spot.compositions.length > 0 ? (
            <div>
              <SectionLabel>{t("spots.composition")}</SectionLabel>
              <div className="mt-2 flex flex-wrap gap-2">
                {spot.compositions.map((c) => (
                  <span
                    key={c}
                    className="inline-block rounded-full border border-border-dark bg-bg-secondary px-3 py-1 text-xs font-medium uppercase tracking-[0.3px] text-text"
                  >
                    {t(`compositions.${c}`)}
                  </span>
                ))}
              </div>
              {spot.customComposition ? (
                <p className="mt-1 text-[13px] italic text-text-secondary">
                  {spot.customComposition}
                </p>
              ) : null}
            </div>
          ) : null}

          {/* Colors */}
          {spot.colors.length > 0 ? (
            <div>
              <SectionLabel>{t("spots.colors")}</SectionLabel>
              <div className="mt-2 flex flex-wrap gap-2">
                {spot.colors.map((color, index) => (
                  <div
                    key={`${color}-${index}`}
                    className="h-[22px] w-[22px] rounded-full border border-border"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {/* Tags */}
          {spot.tags.length > 0 ? (
            <div>
              <SectionLabel>{t("spots.tags")}</SectionLabel>
              <div className="mt-2 flex flex-wrap gap-1">
                {spot.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-block rounded-sm border border-border bg-bg-secondary px-3 py-1.5 text-xs text-text-secondary"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {/* Visibility — an inline icon and label, not a pill */}
          <div
            className={`flex items-center gap-1 text-[13px] font-medium uppercase tracking-[0.4px] ${
              spot.visibility === "PRIVATE" ? "text-text-secondary" : "text-accent"
            }`}
          >
            {spot.visibility === "PRIVATE" ? (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            ) : (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
              </svg>
            )}
            {spot.visibility === "PRIVATE" ? t("spots.visibilityPrivate") : t("spots.visibilityFollowers")}
          </div>
        </div>

        {/* Mini map — tap to expand. The app's 140px rounded thumb inside the
            padding below lg; the full-width strip with coordinates on desktop. */}
        <div className="px-4 pb-4 lg:border-t lg:border-border lg:px-0 lg:pb-0">
          <button
            type="button"
            onClick={() => setMapExpanded(true)}
            aria-label={t("map.tapToExpand")}
            className="group relative block h-[140px] w-full cursor-pointer overflow-hidden rounded-md border border-border lg:h-48 lg:rounded-none lg:border-0"
          >
            <MiniMap latitude={spot.latitude} longitude={spot.longitude} />
            {/* Expand hint: always visible on a touch screen, on hover for a pointer */}
            <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-sm bg-black/50 px-2 py-1 text-xs text-white lg:rounded lg:bg-bg/80 lg:text-text-secondary lg:opacity-0 lg:transition-opacity lg:group-hover:opacity-100">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9m11.25-5.25v4.5m0-4.5h-4.5m4.5 0L15 9m-11.25 11.25v-4.5m0 4.5h4.5m-4.5 0L9 15m11.25 5.25v-4.5m0 4.5h-4.5m4.5 0L15 15" />
              </svg>
              {t("map.tapToExpand")}
            </span>
          </button>
          <div className="hidden items-center justify-between border-t border-border px-4 py-2 lg:flex">
            <p className="font-mono text-xs text-text-tertiary">{coordsLabel}</p>
            {spot.address ? (
              <p className="ml-4 truncate text-xs text-text-tertiary">{spot.address}</p>
            ) : null}
          </div>
        </div>

        {/* Expanded map overlay */}
        {mapExpanded ? (
          <div className="fixed inset-0 z-50 flex flex-col bg-bg">
            <div className="relative flex-1">
              <ExpandedMap latitude={spot.latitude} longitude={spot.longitude} />
              {/* 40px round close button, clear of the status bar */}
              <button
                type="button"
                onClick={() => setMapExpanded(false)}
                aria-label={t("common.close")}
                className="absolute right-4 top-[calc(env(safe-area-inset-top)+1rem)] z-[1000] flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border bg-bg text-text transition-colors hover:bg-bg-secondary"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Coordinates bar */}
            <div className="flex items-center justify-between border-t border-border px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
              <p className="font-mono text-xs text-text-secondary">{coordsLabel}</p>
              {spot.address ? (
                <p className="ml-4 truncate text-xs text-text-tertiary">{spot.address}</p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {/* ── Community Photos Section ─────────────────────────────── */}
      <div className="mt-6 lg:mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-[0.5px] text-text-secondary">
            {t("spotPhotos.title")}
          </h2>
          {user ? (
            <button
              type="button"
              onClick={() => setShowAddPhoto(!showAddPhoto)}
              className="flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-accent transition-colors hover:text-accent-dark"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              {t("spotPhotos.addPhoto")}
            </button>
          ) : null}
        </div>

        {/* Upload form */}
        {showAddPhoto ? (
          <Card className="mb-6 space-y-3">
            <input
              ref={photoInputRef}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(",")}
              onChange={handlePhotoUpload}
              disabled={isUploading}
              className="block w-full text-sm text-text-secondary
                file:mr-3 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-accent file:text-on-accent
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
              className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
            />
            {isUploading ? (
              <p className="flex items-center gap-2 text-sm text-text-tertiary">
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {t("spotPhotos.uploading")}
              </p>
            ) : null}
          </Card>
        ) : null}

        {/* Upload message */}
        {uploadMessage ? (
          <p className={`mb-4 text-sm ${
            uploadMessage.type === "success" ? "text-success" : "text-error"
          }`}>
            {uploadMessage.text}
          </p>
        ) : null}

        {/* Photos grid — the app's three-column, 1px-gutter grid below lg */}
        {photos.length > 0 ? (
          <div className="-mx-4 grid grid-cols-3 gap-px lg:mx-0 lg:gap-2">
            {photos.map((photo) => {
              const canDelete =
                user && (user.id === photo.user.id || isOwner);
              return (
                <div
                  key={photo.id}
                  className="group relative aspect-square overflow-hidden rounded-none bg-bg-secondary lg:rounded-xl"
                >
                  <img
                    src={photo.photoUrl}
                    alt={photo.caption ?? ""}
                    className="h-full w-full object-cover"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <p className="text-xs font-semibold text-white">
                      {photo.user.username}
                    </p>
                    {photo.caption ? (
                      <p className="mt-1 line-clamp-2 text-center text-xs text-white/80">
                        {photo.caption}
                      </p>
                    ) : null}
                  </div>
                  {/* Delete button */}
                  {canDelete ? (
                    <button
                      type="button"
                      onClick={() => handleDeletePhoto(photo)}
                      disabled={deletingPhotoId === photo.id}
                      className="absolute top-1.5 right-1.5 z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity duration-200 hover:bg-error group-hover:opacity-100 disabled:opacity-50"
                      title={t("spotPhotos.deletePhoto")}
                      aria-label={t("spotPhotos.deletePhoto")}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : !photosLoading ? (
          <p className="py-8 text-center text-sm text-text-tertiary">
            {t("spotPhotos.noPhotos")}
          </p>
        ) : null}

        {/* Loading */}
        {photosLoading ? (
          <div className="flex justify-center py-8">
            <svg className="h-6 w-6 animate-spin text-text-tertiary" fill="none" viewBox="0 0 24 24" aria-hidden="true">
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

/** Full-screen interactive Leaflet map for spot detail */
function ExpandedMap({ latitude, longitude }: { latitude: number; longitude: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    import("leaflet").then((L) => {
      if (!containerRef.current || mapRef.current) return;
      const map = L.map(containerRef.current).setView([latitude, longitude], 15);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      }).addTo(map);

      L.marker([latitude, longitude]).addTo(map);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [latitude, longitude]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
