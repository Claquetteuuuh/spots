"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import type { ForwardGeocodeResult } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { useT } from "@/lib/use-t";
import {
  COMPOSITION_TYPES,
  ACCEPTED_IMAGE_TYPES,
  MAX_PHOTO_SIZE_BYTES,
  MAX_PHOTO_SIZE_MB,
} from "@trs/shared/constants";
import { PAGE_WIDE } from "@/components/page";
import { CharacterCount, SelectionCount } from "@/components/ui/limit-hint";
import { CompositionIcon } from "@/components/composition-icon";

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

interface EyedropperView {
  zoom: number;
  x: number;
  y: number;
}

/**
 * The app's section label: 12px uppercase, tracked, secondary — the same
 * treatment the shared Input gives its own label, so a labelled field and a
 * labelled group of buttons read as one system. Required sections carry a
 * red asterisk, as in the app.
 */
function SectionLabel({
  children,
  required = false,
  htmlFor,
  className = "",
}: {
  children: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
  className?: string;
}) {
  const classes = `block text-xs font-medium uppercase tracking-[0.5px] text-text-secondary ${className}`;
  const content = (
    <>
      {children}
      {required ? (
        <>
          {" "}
          <span className="text-error">*</span>
        </>
      ) : null}
    </>
  );
  return htmlFor ? (
    <label htmlFor={htmlFor} className={classes}>
      {content}
    </label>
  ) : (
    <p className={classes}>{content}</p>
  );
}

/** The app's tinted tool surface: an equal-width, hairline-bordered button with an icon and a short label. */
const toolButtonClasses =
  "flex flex-1 items-center justify-center gap-2 rounded-sm border border-border bg-bg-secondary px-2 py-3 text-sm text-text transition-colors cursor-pointer hover:bg-bg-tertiary disabled:cursor-not-allowed disabled:opacity-40";

/** Keep the scaled photo covering its box: no empty gaps once zoomed in, centred when it fits. */
function clampView(v: EyedropperView, canvas: HTMLCanvasElement | null, box: HTMLDivElement | null): EyedropperView {
  if (!canvas || !box) return v;
  const maxX = Math.max(0, (canvas.offsetWidth * v.zoom - box.clientWidth) / 2);
  const maxY = Math.max(0, (canvas.offsetHeight * v.zoom - box.clientHeight) / 2);
  return {
    zoom: v.zoom,
    x: Math.max(-maxX, Math.min(maxX, v.x)),
    y: Math.max(-maxY, Math.min(maxY, v.y)),
  };
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
  // "pick" samples colors under the cursor; "pan" drags the (zoomed) photo around.
  const [eyedropperTool, setEyedropperTool] = useState<"pick" | "pan">("pick");
  // Zoom and pan live together so a zoom change can re-clamp the pan in one update.
  const [eyedropperView, setEyedropperView] = useState({ zoom: 1, x: 0, y: 0 });
  const eyedropperCanvasRef = useRef<HTMLCanvasElement>(null);
  const eyedropperLoupeRef = useRef<HTMLCanvasElement>(null);
  const eyedropperWrapRef = useRef<HTMLDivElement>(null);
  const eyedropperBoxRef = useRef<HTMLDivElement>(null);
  const eyedropperDragRef = useRef<{ startX: number; startY: number; x0: number; y0: number } | null>(null);

  // React registers `wheel` as passive, so preventDefault (to stop the page
  // scrolling while zooming the photo) needs a native listener.
  useEffect(() => {
    const wrap = eyedropperWrapRef.current;
    if (!wrap || !showPhotoEyedropper) return;
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      setEyedropperView((v) =>
        clampView(
          { ...v, zoom: Math.max(1, Math.min(6, v.zoom - e.deltaY * 0.005)) },
          eyedropperCanvasRef.current,
          eyedropperBoxRef.current,
        ),
      );
    }
    wrap.addEventListener("wheel", onWheel, { passive: false });
    return () => wrap.removeEventListener("wheel", onWheel);
  }, [showPhotoEyedropper]);
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

  /** The × on the chosen-location row: forget the point and everything derived from it. */
  function clearLocation() {
    setLatitude(null);
    setLongitude(null);
    setAddress(null);
    setCity(null);
    setCountry(null);
    setManualLat("");
    setManualLng("");
    setSearchQuery("");
    setSearchResults([]);
    setShowDropdown(false);
    setIsTypingAddress(false);
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

  function eyedropperSample(canvas: HTMLCanvasElement, clientX: number, clientY: number) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const rect = canvas.getBoundingClientRect();
    const x = Math.round((clientX - rect.left) * (canvas.width / rect.width));
    const y = Math.round((clientY - rect.top) * (canvas.height / rect.height));
    if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return null;
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    return { x, y, hex: rgbToHex(pixel[0], pixel[1], pixel[2]), rect };
  }

  function clampEyedropperView(v: EyedropperView) {
    return clampView(v, eyedropperCanvasRef.current, eyedropperBoxRef.current);
  }

  function handleEyedropperMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (eyedropperTool !== "pan") return;
    e.preventDefault();
    eyedropperDragRef.current = { startX: e.clientX, startY: e.clientY, x0: eyedropperView.x, y0: eyedropperView.y };
  }

  function handleEyedropperMouseUp() {
    eyedropperDragRef.current = null;
  }

  function handleEyedropperMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const drag = eyedropperDragRef.current;
    if (drag) {
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      setEyedropperView((v) => clampEyedropperView({ ...v, x: drag.x0 + dx, y: drag.y0 + dy }));
      return;
    }
    if (eyedropperTool !== "pick") return;

    const canvas = eyedropperCanvasRef.current;
    const loupe = eyedropperLoupeRef.current;
    const wrap = eyedropperWrapRef.current;
    if (!canvas || !loupe || !wrap) return;
    const lCtx = loupe.getContext("2d");
    if (!lCtx) return;
    const s = eyedropperSample(canvas, e.clientX, e.clientY);
    if (!s) return;

    setEyedropperPreviewColor(s.hex);

    // Draw loupe
    const LSIZE = 100;
    const LZOOM = 4;
    const srcSize = Math.round(LSIZE / LZOOM * (canvas.width / s.rect.width));
    lCtx.clearRect(0, 0, LSIZE, LSIZE);
    lCtx.save();
    lCtx.beginPath();
    lCtx.arc(LSIZE / 2, LSIZE / 2, LSIZE / 2, 0, Math.PI * 2);
    lCtx.clip();
    lCtx.drawImage(canvas, s.x - srcSize / 2, s.y - srcSize / 2, srcSize, srcSize, 0, 0, LSIZE, LSIZE);
    lCtx.restore();
    lCtx.strokeStyle = "#fff";
    lCtx.lineWidth = 1.5;
    lCtx.beginPath();
    lCtx.arc(LSIZE / 2, LSIZE / 2, 5, 0, Math.PI * 2);
    lCtx.stroke();

    // Always above the cursor; clamped inside the wrapper near the edges rather
    // than flipping below, where it would be much harder to read.
    const wrapRect = wrap.getBoundingClientRect();
    const half = loupe.offsetWidth / 2;
    const relX = Math.max(half, Math.min(wrapRect.width - half, e.clientX - wrapRect.left));
    const relY = Math.max(0, e.clientY - wrapRect.top - loupe.offsetHeight - 20);
    loupe.style.opacity = "1";
    loupe.style.left = `${relX}px`;
    loupe.style.top = `${relY}px`;
  }

  function handleEyedropperClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (eyedropperTool !== "pick") return;
    const canvas = eyedropperCanvasRef.current;
    if (!canvas) return;
    const s = eyedropperSample(canvas, e.clientX, e.clientY);
    if (s) setEyedropperPreviewColor(s.hex);
  }

  function handleEyedropperLeave() {
    eyedropperDragRef.current = null;
    const loupe = eyedropperLoupeRef.current;
    if (loupe) loupe.style.opacity = "0";
  }

  function drawPhotoOnCanvas(src: string) {
    setEyedropperReady(false);
    setEyedropperView({ zoom: 1, x: 0, y: 0 });
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
    <div className={`${PAGE_WIDE} pt-4 lg:py-8`}>
      {/* Header — the app's own screen title: 22px bold, no back, no actions */}
      <h1 className="text-[22px] font-bold text-text lg:text-2xl lg:font-semibold lg:tracking-tight">
        {t("spots.addSpot")}
      </h1>

      {/* Step indicator — the app's flat bars below lg: one 2px bar per step,
          brand blue for the current and visited steps, hairline otherwise.
          The bars carry no text, so each is a button with a label for the
          screen reader, and visited ones still take you back. */}
      <div className="mt-1 flex gap-1 lg:hidden" aria-label={t("spots.addSpot")}>
        {steps.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => goToStep(s.key)}
            disabled={i > furthestStep}
            aria-label={`${i + 1}. ${s.label}`}
            aria-current={step === s.key ? "step" : undefined}
            className="flex-1 cursor-pointer py-2 disabled:cursor-not-allowed"
          >
            <span
              className={`block h-0.5 ${i <= currentIndex ? "bg-accent" : "bg-border"}`}
            />
          </button>
        ))}
      </div>

      {/* Desktop keeps its labelled steps */}
      <div className="mt-6 hidden items-center gap-2 lg:flex">
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
        <div className="mt-4 rounded-sm border border-error/20 bg-error-light px-4 py-3 space-y-1">
          {error.split("\n").map((line, i) => (
            <p key={i} className="text-sm text-error flex items-start gap-2">
              <span className="shrink-0 mt-0.5">⚠</span>
              {line}
            </p>
          ))}
        </div>
      ) : null}

      {/* Step content */}
      <div className="mt-6 lg:mt-8">
        {/* ── STEP 1: Photos ────────────────────────────────────────── */}
        {step === "photo" ? (
          <div className="space-y-3">
            {photos.length > 0 ? (
              <>
                {/* Photo grid — the app's 3-up squares, drag-to-reorder */}
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
                      className={`relative aspect-square overflow-hidden rounded-sm cursor-grab active:cursor-grabbing transition-all ${
                        dragOverIndex === index && dragIndex !== index
                          ? "border-2 border-dashed border-accent"
                          : dragIndex === index
                            ? "border border-border opacity-40"
                            : "border border-border"
                      }`}
                    >
                      <img
                        src={photo.preview}
                        alt=""
                        className="h-full w-full object-cover pointer-events-none"
                      />

                      {/* Cover badge */}
                      {index === 0 ? (
                        <span className="absolute top-1 left-1 rounded-sm bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          {t("spots.cover")}
                        </span>
                      ) : null}

                      {/* Order number */}
                      <span className="absolute bottom-1 left-1 rounded-sm bg-black/50 px-[5px] py-0.5 text-[10px] font-semibold text-white">
                        {index + 1}
                      </span>

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removePhoto(index);
                        }}
                        aria-label={`${t("common.delete")} ${index + 1}`}
                        className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-sm font-bold leading-none text-white transition-colors cursor-pointer hover:bg-black/70"
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  {/* Add more tile */}
                  {photos.length < MAX_PHOTOS ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      aria-label={t("spots.pickPhoto")}
                      className="flex aspect-square items-center justify-center rounded-sm border border-dashed border-border bg-bg-secondary text-text-tertiary transition-colors cursor-pointer hover:border-accent hover:text-accent"
                    >
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 4.5v15m7.5-7.5h-15"
                        />
                      </svg>
                    </button>
                  ) : null}
                </div>

                {photos.length < MAX_PHOTOS ? (
                  <p className="text-center text-xs text-text-tertiary">
                    {t("spots.dragToReorder")}
                  </p>
                ) : (
                  <p className="text-center text-xs text-text-secondary">
                    {t("spots.maxPhotosReached")}
                  </p>
                )}

                <p className="text-center text-xs text-text-tertiary">
                  {photos.length}/{MAX_PHOTOS}
                </p>
              </>
            ) : (
              <>
                {/* Empty state — the app's tinted 4:3 placeholder, then one full-width pick button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full aspect-[4/3] items-center justify-center rounded-sm border border-border bg-bg-secondary transition-colors cursor-pointer hover:border-border-dark"
                >
                  <span className="text-[15px] text-text-tertiary">
                    {t("spots.upToPhotos", { count: MAX_PHOTOS })} <span className="text-error">*</span>
                  </span>
                </button>
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => fileInputRef.current?.click()}
                >
                  {t("spots.pickPhoto")}
                </Button>
                <p className="text-center text-xs text-text-tertiary">
                  JPEG, PNG, WebP · {MAX_PHOTO_SIZE_MB}MB max · {t("spots.upToPhotos", { count: String(MAX_PHOTOS) })}
                </p>
              </>
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
          <div className="space-y-4">
            {/* Address search — results sit inline under the field, as in the app */}
            <div className="space-y-1" ref={dropdownRef}>
              <SectionLabel htmlFor="address-search" required>
                {t("map.title")}
              </SectionLabel>
              <div className="relative">
                <Input
                  id="address-search"
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
                  autoComplete="off"
                  className="pr-11"
                />
                {/* Search icon / spinner */}
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary">
                  {isSearching ? (
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                  )}
                </span>
              </div>

              {/* Results card */}
              {showDropdown ? (
                <div className="divide-y divide-border overflow-hidden rounded-sm border border-border bg-bg-secondary">
                  {searchResults.length > 0 ? (
                    searchResults.map((result, i) => (
                      <button
                        key={`${result.latitude}-${result.longitude}-${i}`}
                        type="button"
                        onClick={() => selectSearchResult(result)}
                        className="w-full cursor-pointer px-3 py-2 text-left text-[13px] transition-colors hover:bg-bg-tertiary"
                      >
                        <p className="line-clamp-2 text-text">{result.displayName}</p>
                        {result.city || result.country ? (
                          <p className="mt-0.5 text-xs text-text-tertiary">
                            {[result.city, result.country].filter(Boolean).join(", ")}
                          </p>
                        ) : null}
                      </button>
                    ))
                  ) : !isSearching ? (
                    <p className="px-3 py-2 text-center text-xs text-text-tertiary">
                      {t("map.noResults")}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            {/* Manual coordinates — label, lat/lng row, then the two full-width actions */}
            <div className="space-y-2">
              <SectionLabel>{t("map.orEnterCoords")}</SectionLabel>
              <div className="flex gap-2">
                <div className="min-w-0 flex-1">
                  <Input
                    type="number"
                    step="any"
                    min={-90}
                    max={90}
                    value={manualLat}
                    onChange={(e) => setManualLat(e.target.value)}
                    onBlur={handleSetManualCoords}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSetManualCoords(); }}
                    placeholder={t("map.latitudePlaceholder")}
                    aria-label={t("map.latitudePlaceholder")}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <Input
                    type="number"
                    step="any"
                    min={-180}
                    max={180}
                    value={manualLng}
                    onChange={(e) => setManualLng(e.target.value)}
                    onBlur={handleSetManualCoords}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSetManualCoords(); }}
                    placeholder={t("map.longitudePlaceholder")}
                    aria-label={t("map.longitudePlaceholder")}
                  />
                </div>
              </div>
              <Button
                variant="secondary"
                fullWidth
                onClick={handleSetManualCoords}
                disabled={!manualLat.trim() || !manualLng.trim()}
              >
                {t("map.setCoordinates")}
              </Button>
              <Button
                variant="ghost"
                fullWidth
                onClick={useMyLocation}
                loading={isLocating}
              >
                {t("map.locateMe")}
              </Button>
            </div>

            {/* Map picker — hint above, the app's 200px box on phones and tablets */}
            <div className="space-y-2">
              <p className="text-center text-xs text-text-tertiary">
                {t("map.clickMapHint")}
              </p>
              <div className="h-[200px] overflow-hidden rounded-sm border border-border lg:h-[400px]">
                <LocationPicker
                  latitude={latitude}
                  longitude={longitude}
                  onChange={handleLocationChange}
                />
              </div>
            </div>

            {/* Chosen location — a tinted row: the dot stands for the place */}
            {latitude !== null && longitude !== null ? (
              <div className="flex items-center gap-2 rounded-sm border border-border bg-bg-secondary px-2 py-1.5">
                <span className="h-2 w-2 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate text-[13px] text-text">
                  {[city, country].filter(Boolean).join(", ") ||
                    `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`}
                </span>
                <button
                  type="button"
                  onClick={clearLocation}
                  aria-label={t("map.clearLocation")}
                  className="cursor-pointer px-1 text-[13px] leading-none text-text-tertiary transition-colors hover:text-text"
                >
                  ×
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* ── STEP 3: Details ───────────────────────────────────────── */}
        {step === "details" ? (
          <div className="space-y-6">
            {/* Title & Description */}
            <div className="space-y-1">
              <Input
                label={t("spots.spotTitle")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("spots.spotTitlePlaceholder")}
                maxLength={200}
              />
              <CharacterCount value={title} max={200} />
            </div>

            <div className="space-y-1">
              <Textarea
                id="description"
                label={t("spots.description")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("spots.descriptionPlaceholder")}
                rows={3}
                maxLength={2000}
              />
              <CharacterCount value={description} max={2000} />
            </div>

            {/* Compositions — the app's 3-up grid of square cells */}
            <div>
              <SectionLabel>{t("spots.composition")}</SectionLabel>
              <SelectionCount
                count={selectedCompositions.length}
                max={MAX_COMPOSITIONS}
                className="mt-0.5"
              />
              <div className="mt-2 grid grid-cols-3 gap-2 lg:grid-cols-6">
                {COMPOSITION_TYPES.map((comp) => {
                  const selected = selectedCompositions.includes(comp);
                  return (
                    <button
                      key={comp}
                      type="button"
                      onClick={() => toggleComposition(comp)}
                      aria-pressed={selected}
                      className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-md p-2 transition-colors cursor-pointer ${
                        selected
                          ? "border-2 border-accent bg-bg-secondary text-text"
                          : "border border-border bg-bg text-text-secondary hover:border-border-dark"
                      }`}
                    >
                      <CompositionIcon
                        type={comp}
                        className={`h-7 w-7 ${selected ? "text-accent" : "text-text-secondary"}`}
                      />
                      <span className="line-clamp-2 text-center text-xs leading-tight">
                        {t(`compositions.${comp}`)}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Custom composition input when OTHER is selected */}
              {selectedCompositions.includes("OTHER") ? (
                <div className="mt-3">
                  <Input
                    label={t("spots.customComposition")}
                    value={customComposition}
                    onChange={(e) => setCustomComposition(e.target.value)}
                    placeholder={t("spots.customCompositionPlaceholder")}
                    maxLength={100}
                  />
                </div>
              ) : null}
            </div>

            {/* Colors */}
            <div>
              <SectionLabel>{t("spots.colors")}</SectionLabel>
              <SelectionCount
                count={selectedColors.length}
                max={MAX_COLORS}
                className="mt-0.5"
              />

              {/* Preset swatches — 44px squares; the chosen ones take a 2px text-coloured border */}
              <div className="mt-2 flex flex-wrap gap-3">
                {SUGGESTED_COLORS.map((color) => {
                  const selected = selectedColors.includes(color);
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => toggleColor(color)}
                      aria-pressed={selected}
                      aria-label={color}
                      className={`h-11 w-11 rounded-sm transition-colors cursor-pointer ${
                        selected ? "border-2 border-text" : "border border-border"
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  );
                })}
              </div>

              {/* Color tools row — equal-width tinted surfaces */}
              <div className="mt-3 flex gap-2">
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
                  className={toolButtonClasses}
                >
                  <svg className="h-[18px] w-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 0 0 5.304 0l6.401-6.402M6.75 21A3.75 3.75 0 0 1 3 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 0 0 3.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008Z" />
                  </svg>
                  <span className="text-center">{t("spots.pickColor")}</span>
                </button>

                {/* Eyedropper from screen — only in supported browsers */}
                {typeof window !== "undefined" && "EyeDropper" in window ? (
                  <button
                    type="button"
                    onClick={handleEyeDropper}
                    disabled={selectedColors.length >= MAX_COLORS}
                    className={toolButtonClasses}
                  >
                    <svg className="h-[18px] w-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m15 11-1 1-2-2 1-1m4 0 2-2a1.414 1.414 0 0 0-2-2l-2 2m-4 4-5.5 5.5a2.121 2.121 0 1 0 3 3L15 11Z" />
                    </svg>
                    <span className="text-center">{t("spots.eyedropper")}</span>
                  </button>
                ) : null}

                {/* Eyedropper from the spot's own photos — present like the app's, disabled without a photo */}
                <button
                  type="button"
                  onClick={openPhotoEyedropper}
                  disabled={photos.length === 0 || selectedColors.length >= MAX_COLORS}
                  className={toolButtonClasses}
                >
                  <svg className="h-[18px] w-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.41a2.25 2.25 0 0 1 3.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                  </svg>
                  <span className="text-center">{t("spots.pickFromPhoto")}</span>
                </button>
              </div>

              {/* Photo eyedropper overlay */}
              {showPhotoEyedropper ? (
                <div className="mt-3 rounded-lg border border-accent bg-bg-secondary p-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-xs text-text-secondary font-medium truncate">
                      {t(eyedropperTool === "pan" ? "spots.panHint" : "spots.clickPhotoToPickColor")}
                    </p>

                    {/* Tool toggle: hand (pan) / eyedropper (pick) */}
                    <div className="flex bg-bg rounded-full p-0.5 border border-border shrink-0">
                      {(["pan", "pick"] as const).map((tool) => {
                        const active = eyedropperTool === tool;
                        return (
                          <button
                            key={tool}
                            type="button"
                            aria-label={t(tool === "pan" ? "spots.toolPan" : "spots.toolPick")}
                            aria-pressed={active}
                            onClick={() => {
                              setEyedropperTool(tool);
                              eyedropperDragRef.current = null;
                              handleEyedropperLeave();
                            }}
                            className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
                              active ? "bg-accent text-on-accent" : "text-text-secondary hover:text-text"
                            }`}
                          >
                            {tool === "pan" ? (
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.05 4.575a1.575 1.575 0 1 0-3.15 0v3m3.15-3v-1.5a1.575 1.575 0 0 1 3.15 0v1.5m-3.15 0 .075 5.925m3.075.75V4.575m0 0a1.575 1.575 0 0 1 3.15 0V15M6.9 7.575a1.575 1.575 0 1 0-3.15 0v8.175a6.75 6.75 0 0 0 6.75 6.75h2.018a5.25 5.25 0 0 0 3.712-1.538l1.732-1.732a5.25 5.25 0 0 0 1.538-3.712l.003-2.024a.668.668 0 0 1 .198-.471 1.575 1.575 0 1 0-2.228-2.228 3.818 3.818 0 0 0-1.12 2.687M6.9 7.575V12m6.27 4.318A4.49 4.49 0 0 1 16.35 15m.002 0h-.002" />
                              </svg>
                            ) : (
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m15 11.25 1.5 1.5.75-.75V8.758l2.276-.61a1.5 1.5 0 1 0-1.06-1.06l-.61 2.276H15l-1.5-1.5-.75.75L14.25 12 7.5 18.75a1.5 1.5 0 0 0 0 2.12l-.19.19a1.5 1.5 0 0 0 2.12 0l6.82-6.81L15 11.25Z" />
                              </svg>
                            )}
                          </button>
                        );
                      })}
                    </div>

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
                  <div ref={eyedropperWrapRef} className="relative overflow-visible">
                    {!eyedropperReady ? (
                      <div className="w-full h-[60vh] max-h-[640px] rounded-lg border border-border bg-bg-secondary animate-pulse" />
                    ) : null}
                    <div
                      ref={eyedropperBoxRef}
                      className="h-[60vh] max-h-[640px] flex items-center justify-center overflow-hidden rounded-lg border border-border bg-bg"
                      style={{ display: eyedropperReady ? undefined : "none" }}
                    >
                      <canvas
                        ref={eyedropperCanvasRef}
                        onMouseDown={handleEyedropperMouseDown}
                        onMouseUp={handleEyedropperMouseUp}
                        onMouseMove={handleEyedropperMove}
                        onMouseLeave={handleEyedropperLeave}
                        onClick={handleEyedropperClick}
                        className={`max-w-full max-h-full ${
                          eyedropperTool === "pan" ? "cursor-grab active:cursor-grabbing" : "cursor-crosshair"
                        }`}
                        style={{
                          imageRendering: "auto",
                          transform: `translate(${eyedropperView.x}px, ${eyedropperView.y}px) scale(${eyedropperView.zoom})`,
                          transformOrigin: "center center",
                        }}
                      />
                    </div>
                    {eyedropperReady && eyedropperView.zoom > 1 ? (
                      <p className="text-[10px] text-text-tertiary text-center mt-1">
                        {Math.round(eyedropperView.zoom * 100)}%
                      </p>
                    ) : null}
                    {/* Loupe */}
                    <canvas
                      ref={eyedropperLoupeRef}
                      width={100}
                      height={100}
                      className="absolute pointer-events-none rounded-full border-[3px] border-white shadow-lg transition-opacity duration-100"
                      style={{ opacity: 0, transform: "translateX(-50%)", width: 80, height: 80 }}
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

              {/* Manual color input (web only) — the shared field with a live preview swatch */}
              <div className="mt-3 flex items-center gap-2">
                {colorInputPreview ? (
                  <span
                    className="h-9 w-9 shrink-0 rounded-sm border border-border"
                    style={{ backgroundColor: colorInputPreview }}
                    aria-hidden="true"
                  />
                ) : (
                  <span className="h-9 w-9 shrink-0 rounded-sm border border-dashed border-border bg-bg-secondary" aria-hidden="true" />
                )}
                <div className="min-w-0 flex-1">
                  <Input
                    type="text"
                    value={colorInput}
                    onChange={(e) => handleColorInputChange(e.target.value)}
                    onKeyDown={handleColorInputKeyDown}
                    placeholder={t("spots.colorInputPlaceholder")}
                    aria-label={t("spots.colorInputPlaceholder")}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
                <Button
                  variant="ghost"
                  onClick={addColorFromInput}
                  disabled={!colorInputPreview || selectedColors.length >= MAX_COLORS}
                >
                  {t("spots.addColor")}
                </Button>
              </div>

              {/* Selected colors — 36px swatches, each with a floating × bubble */}
              {selectedColors.length > 0 ? (
                <div className="mt-4">
                  <SectionLabel>
                    {t("spots.selectedColors")} ({selectedColors.length}/{MAX_COLORS})
                  </SectionLabel>
                  <div className="mt-1 flex flex-wrap gap-2 pt-1.5 pr-1.5">
                    {selectedColors.map((c) => (
                      <div key={c} className="relative">
                        <span
                          className="block h-9 w-9 rounded-sm border border-border"
                          style={{ backgroundColor: c }}
                          title={c}
                        />
                        <button
                          type="button"
                          onClick={() => removeColor(c)}
                          aria-label={`${t("common.delete")} ${c}`}
                          className="absolute -top-1.5 -right-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-text text-[11px] font-bold leading-none text-bg transition-opacity cursor-pointer hover:opacity-80"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Tags — the shared field with a ghost add action beside it, chips below */}
            <div>
              <SectionLabel htmlFor="tag-input">{t("spots.tags")}</SectionLabel>
              <div className="mt-1 flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <Input
                    id="tag-input"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    onBlur={addTag}
                    placeholder={t("spots.tagsPlaceholder")}
                    maxLength={50}
                    disabled={tags.length >= MAX_TAGS}
                    autoComplete="off"
                  />
                </div>
                <Button
                  variant="ghost"
                  onClick={addTag}
                  disabled={!tagInput.trim() || tags.length >= MAX_TAGS}
                >
                  {t("common.save")}
                </Button>
              </div>
              <p className="mt-1 text-xs text-text-tertiary">
                {t("spots.tagsHint", { count: MAX_TAGS })}
              </p>
              {tags.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => removeTag(tag)}
                      aria-label={`${t("common.delete")} ${tag}`}
                      className="rounded-sm border border-border bg-bg-secondary px-3 py-1.5 text-xs text-text-secondary transition-colors cursor-pointer hover:bg-bg-tertiary"
                    >
                      {tag} ×
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Visibility — two equal buttons, followers first, one selected style */}
            <div>
              <SectionLabel>{t("spots.visibilityTitle")}</SectionLabel>
              <div className="mt-2 flex gap-2">
                {(["FOLLOWERS", "PRIVATE"] as const).map((option) => {
                  const selected = visibility === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setVisibility(option)}
                      aria-pressed={selected}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-sm py-3 text-sm font-medium transition-colors cursor-pointer ${
                        selected
                          ? "border-2 border-accent bg-accent-tint text-accent"
                          : "border border-border bg-bg text-text-secondary hover:bg-bg-secondary"
                      }`}
                    >
                      {option === "FOLLOWERS" ? (
                        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                        </svg>
                      )}
                      {option === "FOLLOWERS"
                        ? t("spots.visibilityFollowers")
                        : t("spots.visibilityPrivate")}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Validation errors */}
      {validationErrors.length > 0 ? (
        <div className="mt-6 rounded-sm border border-error/20 bg-error-light px-4 py-3 space-y-1">
          {validationErrors.map((msg, i) => (
            <p key={i} className="text-sm text-error flex items-start gap-2">
              <span className="shrink-0 mt-0.5">⚠</span>
              {msg}
            </p>
          ))}
        </div>
      ) : null}

      {/* Bottom navigation — the app's permanent footer: below lg it sticks to
          the bottom of the viewport, just above the tab bar, with a hairline
          on top; from lg it is the in-flow row the desktop already had. */}
      <div
        className="sticky bottom-[calc(50px+env(safe-area-inset-bottom))] z-10 -mx-4 mt-6 flex items-center justify-between border-t border-border bg-bg px-4 py-4
          lg:static lg:mx-0 lg:mt-8 lg:px-0 lg:pb-0 lg:pt-6"
      >
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
