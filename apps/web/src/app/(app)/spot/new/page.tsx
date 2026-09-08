"use client";

import { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/use-t";
import {
  COMPOSITION_TYPES,
  ACCEPTED_IMAGE_TYPES,
  MAX_PHOTO_SIZE_BYTES,
  MAX_PHOTO_SIZE_MB,
} from "@trs/shared/constants";

const LocationPicker = dynamic(() => import("@/components/location-picker"), {
  ssr: false,
});

type Step = "photo" | "location" | "details";

const SUGGESTED_COLORS = [
  "#C44536",
  "#D4A574",
  "#D4A017",
  "#7D8C6E",
  "#4A90A4",
  "#8B7355",
  "#6B6960",
  "#1A1A18",
  "#F2F0EB",
  "#B49A7A",
];

export default function AddSpotPage() {
  const router = useRouter();
  const t = useT();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step state
  const [step, setStep] = useState<Step>("photo");

  // Photo
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Location
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Details
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isFree, setIsFree] = useState(true);
  const [priceInfo, setPriceInfo] = useState("");
  const [selectedCompositions, setSelectedCompositions] = useState<string[]>(
    [],
  );
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  // Submit
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Photo handling ────────────────────────────────────────────────

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError("Please select a JPEG, PNG, WebP, or HEIC image.");
      return;
    }

    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      setError(`Image must be smaller than ${MAX_PHOTO_SIZE_MB}MB.`);
      return;
    }

    setError(null);
    setPhotoFile(file);

    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  // ── Location ──────────────────────────────────────────────────────

  function handleLocationChange(lat: number, lng: number) {
    setLatitude(lat);
    setLongitude(lng);
    reverseGeocode(lat, lng);
  }

  async function reverseGeocode(lat: number, lng: number) {
    try {
      const res = await fetch(
        `/api/geocoding/reverse?lat=${lat}&lon=${lng}`,
      );
      if (res.ok) {
        const json = await res.json();
        const data = json.data;
        setAddress(data.address ?? null);
        setCity(data.city ?? null);
        setCountry(data.country ?? null);
      }
    } catch {
      // Geocoding is optional, don't block the flow
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setLatitude(lat);
        setLongitude(lng);
        reverseGeocode(lat, lng);
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      },
      { enableHighAccuracy: true },
    );
  }

  // ── Compositions ──────────────────────────────────────────────────

  function toggleComposition(comp: string) {
    setSelectedCompositions((prev) =>
      prev.includes(comp)
        ? prev.filter((c) => c !== comp)
        : prev.length < 5
          ? [...prev, comp]
          : prev,
    );
  }

  // ── Colors ────────────────────────────────────────────────────────

  function toggleColor(color: string) {
    setSelectedColors((prev) =>
      prev.includes(color)
        ? prev.filter((c) => c !== color)
        : prev.length < 10
          ? [...prev, color]
          : prev,
    );
  }

  // ── Tags ──────────────────────────────────────────────────────────

  function addTag() {
    const tag = tagInput.trim();
    if (!tag || tags.includes(tag) || tags.length >= 10) return;
    setTags((prev) => [...prev, tag]);
    setTagInput("");
  }

  function handleTagKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  // ── Submit ────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (!photoFile || latitude === null || longitude === null) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Upload photo
      const upload = await apiClient.upload.photo(photoFile);

      // 2. Create spot
      const spot = await apiClient.spots.create({
        latitude,
        longitude,
        photoUrl: upload.url,
        photoKey: upload.key,
        title: title || undefined,
        description: description || undefined,
        isFree,
        priceInfo: priceInfo || undefined,
        compositions: selectedCompositions as typeof COMPOSITION_TYPES[number][],
        colors: selectedColors,
        tags,
      });

      router.push(`/spot/${spot.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
      setIsSubmitting(false);
    }
  }, [
    photoFile,
    latitude,
    longitude,
    title,
    description,
    isFree,
    priceInfo,
    selectedCompositions,
    selectedColors,
    tags,
    router,
  ]);

  // ── Step navigation ───────────────────────────────────────────────

  const steps: { key: Step; label: string }[] = [
    { key: "photo", label: t("spots.takePhoto") },
    { key: "location", label: t("map.title") },
    { key: "details", label: t("spots.details") },
  ];

  const currentIndex = steps.findIndex((s) => s.key === step);

  function canAdvance(): boolean {
    if (step === "photo") return !!photoFile;
    if (step === "location") return latitude !== null && longitude !== null;
    return true;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <h1 className="text-2xl font-semibold tracking-tight text-text">
        {t("spots.addSpot")}
      </h1>

      {/* Step indicator */}
      <div className="mt-6 flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            {i > 0 ? (
              <div className="h-px w-8 bg-border" />
            ) : null}
            <button
              type="button"
              onClick={() => {
                // Only allow going back
                if (i < currentIndex) setStep(s.key);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors cursor-pointer ${
                step === s.key
                  ? "bg-accent text-white"
                  : i < currentIndex
                    ? "text-accent hover:bg-bg-secondary"
                    : "text-text-tertiary"
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full text-xs border border-current">
                {i + 1}
              </span>
              {s.label}
            </button>
          </div>
        ))}
      </div>

      {/* Error */}
      {error ? (
        <div className="mt-4 rounded-sm border border-error/20 bg-error-light px-4 py-3 text-sm text-error">
          {error}
        </div>
      ) : null}

      {/* Step content */}
      <div className="mt-8">
        {/* ── STEP 1: Photo ─────────────────────────────────────────── */}
        {step === "photo" ? (
          <div>
            {photoPreview ? (
              <div className="relative">
                <div className="aspect-[4/3] overflow-hidden rounded-sm border border-border bg-bg-secondary">
                  <img
                    src={photoPreview}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPhotoFile(null);
                    setPhotoPreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="absolute top-3 right-3 rounded-sm bg-bg/80 backdrop-blur-sm px-3 py-1.5 text-sm text-text-secondary hover:bg-bg transition-colors border border-border cursor-pointer"
                >
                  {t("spots.pickPhoto")}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-[4/3] rounded-sm border-2 border-dashed border-border hover:border-accent flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer bg-bg-secondary"
              >
                <svg
                  className="h-10 w-10 text-text-tertiary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                  />
                </svg>
                <span className="text-sm text-text-secondary">
                  {t("spots.pickPhoto")}
                </span>
                <span className="text-xs text-text-tertiary">
                  JPEG, PNG, WebP · {MAX_PHOTO_SIZE_MB}MB max
                </span>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(",")}
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : null}

        {/* ── STEP 2: Location ──────────────────────────────────────── */}
        {step === "location" ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-text-secondary">
                Click on the map to place your spot, or use your current
                location.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={useMyLocation}
                loading={isLocating}
              >
                {t("map.locateMe")}
              </Button>
            </div>

            <div className="h-[400px] rounded-sm border border-border overflow-hidden">
              <LocationPicker
                latitude={latitude}
                longitude={longitude}
                onChange={handleLocationChange}
              />
            </div>

            {latitude !== null && longitude !== null ? (
              <div className="mt-3 flex items-center gap-4 text-sm">
                <span className="font-mono text-text-secondary">
                  {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </span>
                {city || country ? (
                  <span className="text-text-tertiary">
                    {[city, country].filter(Boolean).join(", ")}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* ── STEP 3: Details ───────────────────────────────────────── */}
        {step === "details" ? (
          <div className="space-y-6">
            {/* Title & Description */}
            <Input
              label={t("spots.spotTitle")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("spots.spotTitlePlaceholder")}
              hint="200 characters max"
            />

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="description"
                className="text-sm font-medium text-text"
              >
                {t("spots.description")}
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("spots.descriptionPlaceholder")}
                rows={3}
                maxLength={2000}
                className="w-full rounded-md border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent focus:bg-bg-secondary transition-colors"
              />
              <p className="text-xs text-text-tertiary">
                {description.length}/2000
              </p>
            </div>

            {/* Compositions */}
            <div>
              <label className="text-sm font-medium text-text">
                {t("spots.composition")}
              </label>
              <p className="mt-0.5 text-xs text-text-tertiary">
                Select up to 5
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {COMPOSITION_TYPES.map((comp) => {
                  const selected = selectedCompositions.includes(comp);
                  return (
                    <button
                      key={comp}
                      type="button"
                      onClick={() => toggleComposition(comp)}
                      className={`px-2.5 py-1 text-sm rounded-md border transition-colors cursor-pointer ${
                        selected
                          ? "bg-sage/15 text-sage border-sage/30"
                          : "bg-bg text-text-secondary border-border hover:border-sage/30"
                      }`}
                    >
                      {t(`compositions.${comp}`)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Colors */}
            <div>
              <label className="text-sm font-medium text-text">
                {t("spots.colors")}
              </label>
              <p className="mt-0.5 text-xs text-text-tertiary">
                Select up to 10
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {SUGGESTED_COLORS.map((color) => {
                  const selected = selectedColors.includes(color);
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => toggleColor(color)}
                      className={`h-8 w-8 rounded-sm border-2 transition-all cursor-pointer ${
                        selected
                          ? "border-accent scale-110"
                          : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  );
                })}
              </div>
              {selectedColors.length > 0 ? (
                <div className="mt-2 flex gap-1">
                  {selectedColors.map((c) => (
                    <span
                      key={c}
                      className="inline-block px-1.5 py-0.5 text-xs font-mono text-text-tertiary bg-bg-secondary rounded-sm"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Tags */}
            <div>
              <label className="text-sm font-medium text-text">
                {t("spots.tags")}
              </label>
              <p className="mt-0.5 text-xs text-text-tertiary">
                Press Enter or comma to add (max 10)
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-sm bg-bg-secondary text-text-secondary border border-border rounded-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-text-tertiary hover:text-error transition-colors cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {tags.length < 10 ? (
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    onBlur={addTag}
                    placeholder={
                      tags.length === 0
                        ? t("spots.tagsPlaceholder")
                        : ""
                    }
                    className="flex-1 min-w-[120px] border-none bg-transparent text-sm text-text placeholder:text-text-tertiary focus:outline-none"
                  />
                ) : null}
              </div>
            </div>

            {/* Access */}
            <div>
              <label className="text-sm font-medium text-text">
                {t("spots.pricing")}
              </label>
              <div className="mt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsFree(true)}
                  className={`px-4 py-2 text-sm rounded-sm border transition-colors cursor-pointer ${
                    isFree
                      ? "border-sage text-sage bg-sage/10"
                      : "border-border text-text-secondary hover:bg-bg-secondary"
                  }`}
                >
                  {t("common.free")}
                </button>
                <button
                  type="button"
                  onClick={() => setIsFree(false)}
                  className={`px-4 py-2 text-sm rounded-sm border transition-colors cursor-pointer ${
                    !isFree
                      ? "border-accent text-accent bg-accent/10"
                      : "border-border text-text-secondary hover:bg-bg-secondary"
                  }`}
                >
                  {t("common.paid")}
                </button>
              </div>
              {!isFree ? (
                <div className="mt-3">
                  <Input
                    label={t("spots.priceInfo")}
                    value={priceInfo}
                    onChange={(e) => setPriceInfo(e.target.value)}
                    placeholder="e.g. 5€ parking fee"
                  />
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {/* Bottom navigation */}
      <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
        <div>
          {currentIndex > 0 ? (
            <Button
              variant="ghost"
              onClick={() => setStep(steps[currentIndex - 1].key)}
            >
              {t("common.back")}
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => router.push("/map")}>
              {t("common.cancel")}
            </Button>
          )}
        </div>

        <div>
          {currentIndex < steps.length - 1 ? (
            <Button
              onClick={() => setStep(steps[currentIndex + 1].key)}
              disabled={!canAdvance()}
            >
              {t("common.next")}
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={!canAdvance()}
            >
              {t("spots.addSpot")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
