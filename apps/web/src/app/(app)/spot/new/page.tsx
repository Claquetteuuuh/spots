"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import type { ForwardGeocodeResult } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/use-t";
import {
  COMPOSITION_TYPES,
  ACCEPTED_IMAGE_TYPES,
  MAX_PHOTO_SIZE_BYTES,
  MAX_PHOTO_SIZE_MB,
} from "@trs/shared/constants";
import { PAGE_WIDE } from "@/components/page";
import { CharacterCount, SelectionCount } from "@/components/ui/limit-hint";

const LocationPicker = dynamic(() => import("@/components/location-picker"), {
  ssr: false,
});

const STEPS = ["photo", "location", "details"] as const;
type Step = (typeof STEPS)[number];

function parseStep(value: string | null): Step {
  return (STEPS as readonly string[]).includes(value ?? "")
    ? (value as Step)
    : "photo";
}

const SUGGESTED_COLORS = [
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

const MAX_PHOTOS = 10;
const MAX_COMPOSITIONS = 5;
const MAX_COLORS = 10;
const MAX_TAGS = 10;

interface PhotoItem {
  file: File;
  preview: string;
}

function AddSpotForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useT();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // The step lives in the URL, so the browser's back button (and the phone's
  // back gesture) walks back through the form instead of leaving it and
  // throwing away everything already filled in. The page component stays
  // mounted across these navigations, so the answers survive.
  const step = parseStep(searchParams.get("step"));

  // Every step reached so far stays reachable, so you can jump straight back
  // to where you were rather than clicking Next repeatedly.
  // Seeded from the URL so a deep link / refresh onto a later step keeps the
  // earlier ones reachable; advanced in goToStep. Back/forward can only land on
  // steps already visited, so no effect is needed to track them.
  const [furthestStep, setFurthestStep] = useState(() => STEPS.indexOf(step));

  const goToStep = useCallback(
    (next: Step) => {
      setFurthestStep((furthest) => Math.max(furthest, STEPS.indexOf(next)));
      router.push(`/spot/new?step=${next}`, { scroll: false });
    },
    [router],
  );

  // Photos (multi)
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Location
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Address search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ForwardGeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Details
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCompositions, setSelectedCompositions] = useState<string[]>(
    [],
  );
  const [customComposition, setCustomComposition] = useState("");
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [colorInput, setColorInput] = useState("");
  const [colorInputPreview, setColorInputPreview] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<"PRIVATE" | "FOLLOWERS">("FOLLOWERS");
  const [showPhotoEyedropper, setShowPhotoEyedropper] = useState(false);
  const [eyedropperReady, setEyedropperReady] = useState(false);
  const [eyedropperPreviewColor, setEyedropperPreviewColor] = useState<string | null>(null);
  const eyedropperCanvasRef = useRef<HTMLCanvasElement>(null);
  const eyedropperLoupeRef = useRef<HTMLCanvasElement>(null);
  const colorPickerRef = useRef<HTMLInputElement>(null);

  // Submit
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Photo handling ────────────────────────────────────────────────

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) return;

    const newPhotos: PhotoItem[] = [];
    let hasError = false;

    const filesToProcess = Array.from(files).slice(0, remaining);

    let processed = 0;
    for (const file of filesToProcess) {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        setError("Please select JPEG, PNG, WebP, or HEIC images.");
        hasError = true;
        continue;
      }

      if (file.size > MAX_PHOTO_SIZE_BYTES) {
        setError(`Images must be smaller than ${MAX_PHOTO_SIZE_MB}MB.`);
        hasError = true;
        continue;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        newPhotos.push({
          file,
          preview: ev.target?.result as string,
        });
        processed++;
        if (processed === filesToProcess.length - (hasError ? 1 : 0) || newPhotos.length === filesToProcess.length) {
          setPhotos((prev) => [...prev, ...newPhotos].slice(0, MAX_PHOTOS));
        }
      };
      reader.readAsDataURL(file);
    }

    if (!hasError) {
      setError(null);
    }

    // Reset input so the same file(s) can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  // ── Drag-to-reorder ──────────────────────────────────────────────

  function handleDragStart(index: number) {
    setDragIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    setDragOverIndex(index);
  }

  function handleDragLeave() {
    setDragOverIndex(null);
  }

  function handleDrop(e: React.DragEvent, dropIndex: number) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }

    setPhotos((prev) => {
      const next = [...prev];
      const [dragged] = next.splice(dragIndex, 1);
      next.splice(dropIndex, 0, dragged);
      return next;
    });

    setDragIndex(null);
    setDragOverIndex(null);
  }

  function handleDragEnd() {
    setDragIndex(null);
    setDragOverIndex(null);
  }

  // ── Location (synchronized: address ↔ coords ↔ map) ───────────────

  /**
   * Single source of truth for setting a location.
   * Every input method (map click, address search, manual coords, GPS)
   * funnels through here so all fields stay in sync.
   */
  function applyLocation(lat: number, lng: number, opts?: {
    address?: string | null;
    city?: string | null;
    country?: string | null;
    skipReverseGeocode?: boolean;
  }) {
    setLatitude(lat);
    setLongitude(lng);
    setManualLat(String(lat));
    setManualLng(String(lng));

    if (opts?.address !== undefined) {
      setAddress(opts.address);
      setSearchQuery(opts.address ?? "");
    }
    if (opts?.city !== undefined) setCity(opts.city);
    if (opts?.country !== undefined) setCountry(opts.country);

    if (!opts?.skipReverseGeocode) {
      doReverseGeocode(lat, lng);
    }
  }

  /** Reverse-geocode and fill address/city/country + search field. */
  async function doReverseGeocode(lat: number, lng: number) {
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
        if (data.address) {
          setSearchQuery(data.address);
        }
      }
    } catch {
      // Geocoding is optional, don't block the flow
    }
  }

  /** Map click / drag */
  function handleLocationChange(lat: number, lng: number) {
    applyLocation(lat, lng);
  }

  /** GPS locate */
  function useMyLocation() {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        applyLocation(pos.coords.latitude, pos.coords.longitude);
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      },
      { enableHighAccuracy: true },
    );
  }

  // ── Address search ────────────────────────────────────────────────

  const [isTypingAddress, setIsTypingAddress] = useState(false);

  useEffect(() => {
    // Only trigger search when user is actively typing, not when we
    // programmatically update searchQuery from a map click / geocode.
    // Stale results are cleared by the handlers that leave the "typing"
    // state, so this effect never has to set state synchronously.
    if (!isTypingAddress || searchQuery.length < 2) return;

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await apiClient.geocoding.forward(searchQuery);
        setSearchResults(results);
        setShowDropdown(true);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchQuery, isTypingAddress]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setIsTypingAddress(false);
        setSearchResults([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /** User selects an address from autocomplete */
  function selectSearchResult(result: ForwardGeocodeResult) {
    setIsTypingAddress(false);
    setShowDropdown(false);
    setSearchResults([]);
    applyLocation(result.latitude, result.longitude, {
      address: result.displayName,
      city: result.city,
      country: result.country,
      skipReverseGeocode: true,
    });
  }

  /** User manually enters lat/lng */
  function handleSetManualCoords() {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return;
    applyLocation(lat, lng);
  }

  // ── Compositions ──────────────────────────────────────────────────

  function toggleComposition(comp: string) {
    setSelectedCompositions((prev) =>
      prev.includes(comp)
        ? prev.filter((c) => c !== comp)
        : prev.length < MAX_COMPOSITIONS
          ? [...prev, comp]
          : prev,
    );
  }

  // ── Colors ────────────────────────────────────────────────────────

  function toggleColor(color: string) {
    setSelectedColors((prev) =>
      prev.includes(color)
        ? prev.filter((c) => c !== color)
        : prev.length < MAX_COLORS
          ? [...prev, color]
          : prev,
    );
  }

  // ── Color helpers ─────────────────────────────────────────────────

  function rgbToHex(r: number, g: number, b: number): string {
    return "#" + [r, g, b].map((x) => Math.max(0, Math.min(255, x)).toString(16).padStart(2, "0")).join("");
  }

  function hslToHex(h: number, s: number, l: number): string {
    const sn = s / 100;
    const ln = l / 100;
    const a = sn * Math.min(ln, 1 - ln);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = ln - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, "0");
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  function parseColorValue(input: string): string | null {
    const trimmed = input.trim();
    if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) return trimmed.toUpperCase();
    const rgbMatch = trimmed.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i);
    if (rgbMatch) return rgbToHex(+rgbMatch[1], +rgbMatch[2], +rgbMatch[3]).toUpperCase();
    const hslMatch = trimmed.match(/^hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%?\s*,\s*(\d{1,3})%?\s*\)$/i);
    if (hslMatch) return hslToHex(+hslMatch[1], +hslMatch[2], +hslMatch[3]).toUpperCase();
    return null;
  }

  function handleColorInputChange(value: string) {
    setColorInput(value);
    const parsed = parseColorValue(value);
    setColorInputPreview(parsed);
  }

  function addColorFromInput() {
    const parsed = colorInputPreview;
    if (!parsed || selectedColors.includes(parsed) || selectedColors.length >= MAX_COLORS) return;
    setSelectedColors((prev) => [...prev, parsed]);
    setColorInput("");
    setColorInputPreview(null);
  }

  function handleColorInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      addColorFromInput();
    }
  }

  function addColorIfNew(hex: string) {
    const upper = hex.toUpperCase();
    if (!selectedColors.includes(upper) && selectedColors.length < MAX_COLORS) {
      setSelectedColors((prev) => [...prev, upper]);
    }
  }

  // Use native "change" event (fires once on close) instead of React onChange
  // which fires on every movement in the color wheel
  useEffect(() => {
    const el = colorPickerRef.current;
    if (!el) return;
    const handler = (e: Event) => {
      addColorIfNew((e.target as HTMLInputElement).value);
    };
    el.addEventListener("change", handler);
    return () => el.removeEventListener("change", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedColors]);

  async function handleEyeDropper() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const eyeDropper = new (window as any).EyeDropper();
      const result = await eyeDropper.open();
      addColorIfNew(result.sRGBHex);
    } catch {
      // User cancelled or API not available
    }
  }

  function handleEyedropperMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = eyedropperCanvasRef.current;
    const loupe = eyedropperLoupeRef.current;
    if (!canvas || !loupe) return;
    const ctx = canvas.getContext("2d");
    const lCtx = loupe.getContext("2d");
    if (!ctx || !lCtx) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) * (canvas.width / rect.width));
    const y = Math.round((e.clientY - rect.top) * (canvas.height / rect.height));
    if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return;

    // Update preview color
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
    setEyedropperPreviewColor(hex);

    // Draw loupe
    const LSIZE = 100;
    const ZOOM = 3;
    const srcSize = Math.round(LSIZE / ZOOM * (canvas.width / rect.width));
    lCtx.clearRect(0, 0, LSIZE, LSIZE);
    lCtx.save();
    lCtx.beginPath();
    lCtx.arc(LSIZE / 2, LSIZE / 2, LSIZE / 2, 0, Math.PI * 2);
    lCtx.clip();
    lCtx.drawImage(canvas, x - srcSize / 2, y - srcSize / 2, srcSize, srcSize, 0, 0, LSIZE, LSIZE);
    lCtx.restore();
    // Crosshair
    lCtx.strokeStyle = "#fff";
    lCtx.lineWidth = 1.5;
    lCtx.beginPath();
    lCtx.arc(LSIZE / 2, LSIZE / 2, 5, 0, Math.PI * 2);
    lCtx.stroke();

    loupe.style.opacity = "1";
    loupe.style.left = `${e.clientX - rect.left}px`;
    loupe.style.top = `${e.clientY - rect.top - 60}px`;
  }

  function handleEyedropperClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = eyedropperCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) * (canvas.width / rect.width));
    const y = Math.round((e.clientY - rect.top) * (canvas.height / rect.height));
    if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return;
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    setEyedropperPreviewColor(rgbToHex(pixel[0], pixel[1], pixel[2]));
  }

  function handleEyedropperLeave() {
    const loupe = eyedropperLoupeRef.current;
    if (loupe) loupe.style.opacity = "0";
  }

  function drawPhotoOnCanvas(src: string) {
    setEyedropperReady(false);
    setTimeout(() => {
      const canvas = eyedropperCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);
        setEyedropperReady(true);
      };
      img.src = src;
    }, 50);
  }

  function openPhotoEyedropper() {
    if (photos.length === 0) return;
    setEyedropperPreviewColor(null);
    setShowPhotoEyedropper(true);
    drawPhotoOnCanvas(photos[0].preview);
  }

  function removeColor(color: string) {
    setSelectedColors((prev) => prev.filter((c) => c !== color));
  }

  // ── Tags ──────────────────────────────────────────────────────────

  function addTag() {
    const tag = tagInput.trim();
    if (!tag || tags.includes(tag) || tags.length >= MAX_TAGS) return;
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

  // ── Validation ─────────────────────────────────────────────────────

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  function validateForm(): string[] {
    const errors: string[] = [];

    if (photos.length === 0) {
      errors.push(t("spots.validation.photosRequired"));
    }
    if (latitude === null || longitude === null) {
      errors.push(t("spots.validation.locationRequired"));
    }
    if (title && title.length > 200) {
      errors.push(t("spots.validation.titleTooLong"));
    }
    if (description && description.length > 2000) {
      errors.push(t("spots.validation.descriptionTooLong"));
    }

    // Validate hex colors
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

  // ── Submit ────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors([]);

    if (photos.length === 0 || latitude === null || longitude === null) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Upload all photos
      const uploads = await Promise.all(
        photos.map((p) => apiClient.upload.photo(p.file)),
      );

      // 2. Build photos payload
      const photosPayload = uploads.map((u) => ({ url: u.url, key: u.key }));

      // 3. Create spot — first photo is the cover
      const spot = await apiClient.spots.create({
        latitude,
        longitude,
        photoUrl: uploads[0].url,
        photoKey: uploads[0].key,
        photos: photosPayload,
        title: title || undefined,
        description: description || undefined,
        isFree: true,
        visibility,
        customComposition: selectedCompositions.includes("OTHER") ? (customComposition || undefined) : undefined,
        compositions: selectedCompositions as typeof COMPOSITION_TYPES[number][],
        colors: selectedColors,
        tags,
      });

      router.push(`/spot/${spot.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
      setIsSubmitting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    photos,
    latitude,
    longitude,
    title,
    description,
    visibility,
    customComposition,
    selectedCompositions,
    selectedColors,
    tags,
    router,
    t,
  ]);

  // ── Step navigation ───────────────────────────────────────────────

  const steps: { key: Step; label: string; required?: boolean }[] = [
    { key: "photo", label: t("spots.takePhoto"), required: true },
    { key: "location", label: t("map.title"), required: true },
    { key: "details", label: t("spots.details") },
  ];

  const currentIndex = steps.findIndex((s) => s.key === step);

  const hasWork =
    photos.length > 0 || latitude !== null || title.trim().length > 0;

  useEffect(() => {
    if (!hasWork) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasWork]);

  function canAdvance(): boolean {
    if (step === "photo") return photos.length > 0;
    if (step === "location") return latitude !== null && longitude !== null;
    return true;
  }

  return (
    <div className={`${PAGE_WIDE} py-8`}>
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
              onClick={() => goToStep(s.key)}
              disabled={i > furthestStep}
              aria-current={step === s.key ? "step" : undefined}
              className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                step === s.key
                  ? "bg-accent text-on-accent"
                  : i <= furthestStep
                    ? "cursor-pointer text-accent hover:bg-bg-secondary"
                    : "cursor-not-allowed text-text-tertiary"
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full text-xs border border-current">
                {i + 1}
              </span>
              {s.label}
              {s.required ? <span className="text-error ml-0.5">*</span> : null}
            </button>
          </div>
        ))}
      </div>

      {/* Error */}
      {error ? (
        <div className="mt-4 rounded-lg border border-error/20 bg-error-light px-4 py-3 space-y-1">
          {error.split("\n").map((line, i) => (
            <p key={i} className="text-sm text-error flex items-start gap-2">
              <span className="shrink-0 mt-0.5">⚠</span>
              {line}
            </p>
          ))}
        </div>
      ) : null}

      {/* Step content */}
      <div className="mt-8">
        {/* ── STEP 1: Photos ────────────────────────────────────────── */}
        {step === "photo" ? (
          <div>
            {photos.length > 0 ? (
              <div>
                {/* Photo grid — drag-to-reorder */}
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photo, index) => (
                    <div
                      key={`${photo.file.name}-${index}`}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`relative aspect-square overflow-hidden rounded-lg border cursor-grab active:cursor-grabbing transition-all ${
                        dragOverIndex === index && dragIndex !== index
                          ? "border-2 border-dashed border-accent"
                          : dragIndex === index
                            ? "opacity-40 border-border"
                            : "border-border"
                      }`}
                    >
                      <img
                        src={photo.preview}
                        alt=""
                        className="h-full w-full object-cover pointer-events-none"
                      />

                      {/* Cover badge */}
                      {index === 0 ? (
                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[10px] font-semibold bg-accent text-on-accent rounded-lg">
                          Cover
                        </span>
                      ) : null}

                      {/* Order number */}
                      <span className="absolute bottom-1.5 left-1.5 flex h-5 w-5 items-center justify-center text-[10px] font-semibold bg-bg/80 backdrop-blur-sm text-text rounded-lg border border-border">
                        {index + 1}
                      </span>

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removePhoto(index);
                        }}
                        className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-lg bg-bg/80 backdrop-blur-sm text-text-secondary hover:text-error transition-colors cursor-pointer border border-border"
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  {/* Add more button */}
                  {photos.length < MAX_PHOTOS ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-accent flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer bg-bg-secondary"
                    >
                      <svg
                        className="h-6 w-6 text-text-tertiary"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 4.5v15m7.5-7.5h-15"
                        />
                      </svg>
                      <span className="text-[10px] text-text-tertiary">
                        {photos.length}/{MAX_PHOTOS}
                      </span>
                    </button>
                  ) : null}
                </div>

                <p className="mt-3 text-xs text-text-tertiary">
                  {t("spots.dragToReorder")}
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-[4/3] rounded-lg border-2 border-dashed border-border hover:border-accent flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer bg-bg-secondary"
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
                  {t("spots.pickPhoto")} <span className="text-error">*</span>
                </span>
                <span className="text-xs text-text-tertiary">
                  JPEG, PNG, WebP · {MAX_PHOTO_SIZE_MB}MB max · {t("spots.upToPhotos", { count: String(MAX_PHOTOS) })}
                </span>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(",")}
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : null}

        {/* ── STEP 2: Location ──────────────────────────────────────── */}
        {step === "location" ? (
          <div className="space-y-3">
            <label className="text-sm font-medium text-text">
              {t("map.title")} <span className="text-error">*</span>
            </label>
            {/* Address search */}
            <div className="relative" ref={dropdownRef}>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setIsTypingAddress(true);
                    setSearchQuery(e.target.value);
                    if (e.target.value.length < 2) {
                      setSearchResults([]);
                      setShowDropdown(false);
                    }
                  }}
                  onFocus={() => {
                    if (searchResults.length > 0) setShowDropdown(true);
                  }}
                  placeholder={t("map.searchAddress")}
                  className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors pr-9"
                />
                {/* Search icon / spinner */}
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">
                  {isSearching ? (
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                  )}
                </span>
              </div>

              {/* Dropdown results */}
              {showDropdown ? (
                <div className="absolute left-0 right-0 top-full mt-1 z-10 border border-border rounded-lg bg-bg overflow-hidden">
                  {searchResults.length > 0 ? (
                    searchResults.map((result, i) => (
                      <button
                        key={`${result.latitude}-${result.longitude}-${i}`}
                        type="button"
                        onClick={() => selectSearchResult(result)}
                        className="w-full text-left px-3 py-2.5 text-sm hover:bg-bg-secondary transition-colors cursor-pointer border-b border-border last:border-b-0"
                      >
                        <p className="text-text truncate">{result.displayName}</p>
                        {result.city || result.country ? (
                          <p className="text-xs text-text-tertiary mt-0.5">
                            {[result.city, result.country].filter(Boolean).join(", ")}
                          </p>
                        ) : null}
                      </button>
                    ))
                  ) : !isSearching ? (
                    <p className="px-3 py-2.5 text-sm text-text-tertiary">
                      {t("map.noResults")}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            {/* Coordinates + locate me */}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="text-xs text-text-tertiary mb-1 block">
                  {t("map.latitudePlaceholder")}
                </label>
                <input
                  type="number"
                  step="any"
                  min={-90}
                  max={90}
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  onBlur={handleSetManualCoords}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSetManualCoords(); }}
                  placeholder="-90 … 90"
                  className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-text-tertiary mb-1 block">
                  {t("map.longitudePlaceholder")}
                </label>
                <input
                  type="number"
                  step="any"
                  min={-180}
                  max={180}
                  value={manualLng}
                  onChange={(e) => setManualLng(e.target.value)}
                  onBlur={handleSetManualCoords}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSetManualCoords(); }}
                  placeholder="-180 … 180"
                  className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
                />
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={useMyLocation}
                loading={isLocating}
              >
                {t("map.locateMe")}
              </Button>
            </div>

            {/* Map */}
            <div className="h-[400px] rounded-lg border border-border overflow-hidden">
              <LocationPicker
                latitude={latitude}
                longitude={longitude}
                onChange={handleLocationChange}
              />
            </div>
            <p className="text-xs text-text-tertiary">
              {t("map.clickMapHint")}
            </p>

            {/* Coordinate display */}
            {latitude !== null && longitude !== null ? (
              <div className="flex items-center gap-4 text-sm">
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
                className="w-full rounded-2xl border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent focus:bg-bg-secondary transition-colors"
              />
              <CharacterCount value={description} max={2000} />
            </div>

            {/* Compositions */}
            <div>
              <label className="text-sm font-medium text-text">
                {t("spots.composition")}
              </label>
              <SelectionCount
                count={selectedCompositions.length}
                max={MAX_COMPOSITIONS}
                className="mt-0.5"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {COMPOSITION_TYPES.map((comp) => {
                  const selected = selectedCompositions.includes(comp);
                  return (
                    <button
                      key={comp}
                      type="button"
                      onClick={() => toggleComposition(comp)}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-colors cursor-pointer ${
                        selected
                          ? "border-accent bg-accent-tint text-accent-dark"
                          : "border-border bg-bg text-text-secondary hover:border-border-dark"
                      }`}
                    >
                      {t(`compositions.${comp}`)}
                    </button>
                  );
                })}
              </div>

              {/* Custom composition input when OTHER is selected */}
              {selectedCompositions.includes("OTHER") ? (
                <div className="mt-3">
                  <input
                    value={customComposition}
                    onChange={(e) => setCustomComposition(e.target.value)}
                    placeholder={t("spots.customCompositionPlaceholder")}
                    maxLength={100}
                    className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
                  />
                  <p className="mt-1 text-xs text-text-tertiary">
                    {t("spots.customComposition")}
                  </p>
                </div>
              ) : null}
            </div>

            {/* Colors */}
            <div>
              <label className="text-sm font-medium text-text">
                {t("spots.colors")}
              </label>
              <SelectionCount
                count={selectedColors.length}
                max={MAX_COLORS}
                className="mt-0.5"
              />

              {/* Preset swatches */}
              <div className="mt-2 flex flex-wrap gap-2">
                {SUGGESTED_COLORS.map((color) => {
                  const selected = selectedColors.includes(color);
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => toggleColor(color)}
                      className={`h-8 w-8 rounded-lg border-2 transition-all cursor-pointer ${
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

              {/* Selected colors with remove */}
              {selectedColors.length > 0 ? (
                <div className="mt-3">
                  <p className="text-xs text-text-secondary uppercase tracking-wide mb-1.5">
                    {t("spots.selectedColors")} ({selectedColors.length}/10)
                  </p>
                  <div className="flex flex-wrap gap-1">
                  {selectedColors.map((c) => (
                    <span
                      key={c}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-mono text-text-tertiary bg-bg-secondary rounded-lg border border-border"
                    >
                      <span
                        className="inline-block h-3 w-3 rounded-lg border border-border"
                        style={{ backgroundColor: c }}
                      />
                      {c}
                      <button
                        type="button"
                        onClick={() => removeColor(c)}
                        className="text-text-tertiary hover:text-error transition-colors cursor-pointer ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  </div>
                </div>
              ) : null}

              {/* Color tools row */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {/* Native color picker — "change" event fires only on close */}
                <input
                  ref={colorPickerRef}
                  type="color"
                  defaultValue="#8B7355"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => colorPickerRef.current?.click()}
                  disabled={selectedColors.length >= MAX_COLORS}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-text-secondary hover:bg-bg-secondary transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 0 0 5.304 0l6.401-6.402M6.75 21A3.75 3.75 0 0 1 3 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 0 0 3.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008Z" />
                  </svg>
                  {t("spots.pickColor")}
                </button>

                {/* Eyedropper from screen — only in supported browsers */}
                {typeof window !== "undefined" && "EyeDropper" in window ? (
                  <button
                    type="button"
                    onClick={handleEyeDropper}
                    disabled={selectedColors.length >= MAX_COLORS}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-text-secondary hover:bg-bg-secondary transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m15 11-1 1-2-2 1-1m4 0 2-2a1.414 1.414 0 0 0-2-2l-2 2m-4 4-5.5 5.5a2.121 2.121 0 1 0 3 3L15 11Z" />
                    </svg>
                    {t("spots.eyedropper")}
                  </button>
                ) : null}

                {/* Eyedropper from selected photos */}
                {photos.length > 0 ? (
                  <button
                    type="button"
                    onClick={openPhotoEyedropper}
                    disabled={selectedColors.length >= MAX_COLORS}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-text-secondary hover:bg-bg-secondary transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.41a2.25 2.25 0 0 1 3.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                    </svg>
                    {t("spots.pickFromPhoto")}
                  </button>
                ) : null}
              </div>

              {/* Photo eyedropper overlay */}
              {showPhotoEyedropper ? (
                <div className="mt-3 rounded-lg border border-accent bg-bg-secondary p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-text-secondary font-medium">
                      {t("spots.clickPhotoToPickColor")}
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowPhotoEyedropper(false)}
                      className="text-xs text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  {/* Photo selector if multiple photos */}
                  {photos.length > 1 ? (
                    <div className="flex gap-1.5 mb-2 overflow-x-auto">
                      {photos.map((photo, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => drawPhotoOnCanvas(photo.preview)}
                          className="h-10 w-10 flex-shrink-0 rounded-lg border border-border overflow-hidden cursor-pointer hover:border-accent transition-colors"
                        >
                          <img src={photo.preview} alt="" className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <div className="relative">
                    {!eyedropperReady ? (
                      <div className="absolute inset-0 rounded-lg border border-border bg-bg-secondary animate-pulse" />
                    ) : null}
                    <canvas
                      ref={eyedropperCanvasRef}
                      onMouseMove={handleEyedropperMove}
                      onMouseLeave={handleEyedropperLeave}
                      onClick={handleEyedropperClick}
                      className="w-full max-h-[300px] object-contain rounded-lg cursor-crosshair border border-border"
                      style={{ imageRendering: "auto", opacity: eyedropperReady ? 1 : 0, minHeight: eyedropperReady ? undefined : 300 }}
                    />
                    {/* Loupe */}
                    <canvas
                      ref={eyedropperLoupeRef}
                      width={100}
                      height={100}
                      className="absolute pointer-events-none rounded-full border-[3px] border-white shadow-lg transition-opacity duration-100"
                      style={{ opacity: 0, transform: "translate(-50%, 0)", width: 80, height: 80 }}
                    />
                  </div>

                  {/* Preview bar + validate */}
                  <div className="flex items-center gap-2 mt-2">
                    {eyedropperPreviewColor ? (
                      <>
                        <span
                          className="h-8 w-8 rounded-full border border-border flex-shrink-0"
                          style={{ backgroundColor: eyedropperPreviewColor }}
                        />
                        <span className="text-xs text-text font-mono flex-1">
                          {eyedropperPreviewColor}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (eyedropperPreviewColor) {
                              addColorIfNew(eyedropperPreviewColor);
                            }
                            setEyedropperPreviewColor(null);
                            setShowPhotoEyedropper(false);
                          }}
                          className="px-4 py-1.5 text-sm font-semibold bg-accent text-on-accent rounded-full hover:opacity-90 transition-opacity cursor-pointer"
                        >
                          {t("common.validate")}
                        </button>
                      </>
                    ) : (
                      <p className="text-xs text-text-tertiary flex-1 text-center">
                        {t("spots.dragToPickColor")}
                      </p>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Manual color input */}
              <div className="mt-2 flex items-center gap-2">
                {colorInputPreview ? (
                  <span
                    className="h-8 w-8 rounded-lg border border-border flex-shrink-0"
                    style={{ backgroundColor: colorInputPreview }}
                  />
                ) : (
                  <span className="h-8 w-8 rounded-lg border border-dashed border-border flex-shrink-0 bg-bg-secondary" />
                )}
                <input
                  type="text"
                  value={colorInput}
                  onChange={(e) => handleColorInputChange(e.target.value)}
                  onKeyDown={handleColorInputKeyDown}
                  placeholder={t("spots.colorInputPlaceholder")}
                  className="flex-1 min-w-0 rounded-lg border border-border bg-bg-secondary px-3 py-1.5 text-xs font-mono text-text placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
                />
                <button
                  type="button"
                  onClick={addColorFromInput}
                  disabled={!colorInputPreview || selectedColors.length >= MAX_COLORS}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-text-secondary hover:bg-bg-secondary transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {t("spots.addColor")}
                </button>
              </div>
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
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-sm bg-bg-secondary text-text-secondary border border-border rounded-lg"
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
                {tags.length < MAX_TAGS ? (
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

            {/* Visibility */}
            <div>
              <label className="text-sm font-medium text-text">
                {t("spots.visibilityTitle")}
              </label>
              <div className="mt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setVisibility("PRIVATE")}
                  className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg border transition-colors cursor-pointer ${
                    visibility === "PRIVATE"
                      ? "border-accent text-accent bg-accent/10"
                      : "border-border text-text-secondary hover:bg-bg-secondary"
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                  {t("spots.visibilityPrivate")}
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility("FOLLOWERS")}
                  className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg border transition-colors cursor-pointer ${
                    visibility === "FOLLOWERS"
                      ? "border-accent bg-accent-tint text-accent-dark"
                      : "border-border text-text-secondary hover:bg-bg-secondary"
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                  </svg>
                  {t("spots.visibilityFollowers")}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Validation errors */}
      {validationErrors.length > 0 ? (
        <div className="mt-6 rounded-lg border border-error/20 bg-error-light px-4 py-3 space-y-1">
          {validationErrors.map((msg, i) => (
            <p key={i} className="text-sm text-error flex items-start gap-2">
              <span className="shrink-0 mt-0.5">⚠</span>
              {msg}
            </p>
          ))}
        </div>
      ) : null}

      {/* Bottom navigation */}
      <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
        <div>
          {currentIndex > 0 ? (
            <Button
              variant="ghost"
              onClick={() => goToStep(steps[currentIndex - 1].key)}
            >
              {t("common.back")}
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={() => {
                if (hasWork && !window.confirm(t("spots.discardConfirm"))) return;
                router.push("/map");
              }}
            >
              {t("common.cancel")}
            </Button>
          )}
        </div>

        <div>
          {currentIndex < steps.length - 1 ? (
            <Button
              onClick={() => goToStep(steps[currentIndex + 1].key)}
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

/**
 * `useSearchParams` needs a Suspense boundary; the step lives in the query
 * string so the browser's back button walks the form instead of leaving it.
 */
export default function AddSpotPage() {
  return (
    <Suspense>
      <AddSpotForm />
    </Suspense>
  );
}
