"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import type { Spot } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/lib/use-t";
import { COMPOSITION_TYPES, type SpotAccessibility } from "@trs/shared/constants";
import { PAGE_WIDE, PageHeader } from "@/components/page";
import { CharacterCount, SelectionCount } from "@/components/ui/limit-hint";
import { CompositionIcon } from "@/components/composition-icon";
import { AccessibilityPicker } from "@/components/accessibility-picker";

const SUGGESTED_COLORS = [
  "#FAFAF8", "#F5E6D3",
  "#D4A574", "#B49A7A", "#8B7355", "#6B5740",
  "#7D8C6E", "#5B6850", "#2E4A3E",
  "#4A6FA5", "#4A90A4", "#2C5F7C",
  "#C44536", "#9B2335",
  "#D4A017", "#C8B560",
  "#6B5B8D", "#8E6F8E",
  "#6B6960", "#3D3D3D", "#1A1A18",
];

const MAX_COMPOSITIONS = 5;
const MAX_COLORS = 10;

function SectionLabel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={`block text-xs font-medium uppercase tracking-[0.5px] text-text-secondary ${className}`}>
      {children}
    </p>
  );
}

export default function EditSpotPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  // The id, not the object: a refreshed session must not reload the form.
  const userId = user?.id;
  const t = useT();
  const colorPickerRef = useRef<HTMLInputElement>(null);

  const [spot, setSpot] = useState<Spot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Editable fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCompositions, setSelectedCompositions] = useState<string[]>([]);
  const [customComposition, setCustomComposition] = useState("");
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [accessibility, setAccessibility] = useState<SpotAccessibility | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiClient.spots
      .get(id)
      .then((data) => {
        if (cancelled) return;
        // Only the owner can edit
        if (userId && data.userId !== userId) {
          router.replace(`/spot/${id}`);
          return;
        }
        setSpot(data);
        setTitle(data.title ?? "");
        setDescription(data.description ?? "");
        setSelectedCompositions(data.compositions ?? []);
        setCustomComposition(data.customComposition ?? "");
        setSelectedColors(data.colors ?? []);
        setAccessibility(data.accessibility ?? null);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : t("common.error"));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, userId, router]);

  function toggleComposition(comp: string) {
    setSelectedCompositions((prev) =>
      prev.includes(comp)
        ? prev.filter((c) => c !== comp)
        : prev.length < MAX_COMPOSITIONS
          ? [...prev, comp]
          : prev,
    );
  }

  function toggleColor(color: string) {
    setSelectedColors((prev) =>
      prev.includes(color)
        ? prev.filter((c) => c !== color)
        : prev.length < MAX_COLORS
          ? [...prev, color]
          : prev,
    );
  }

  function removeColor(color: string) {
    setSelectedColors((prev) => prev.filter((c) => c !== color));
  }

  function addColorIfNew(hex: string) {
    const upper = hex.toUpperCase();
    if (!selectedColors.includes(upper) && selectedColors.length < MAX_COLORS) {
      setSelectedColors((prev) => [...prev, upper]);
    }
  }

  // Native color picker "change" event (fires on close, not on every movement)
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

  const handleSave = useCallback(async () => {
    if (!spot) return;
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const updated = await apiClient.spots.update(spot.id, {
        title: title || undefined,
        description: description || undefined,
        compositions: selectedCompositions as typeof COMPOSITION_TYPES[number][],
        customComposition: selectedCompositions.includes("OTHER") ? (customComposition || undefined) : undefined,
        colors: selectedColors,
        accessibility,
      });
      setSpot(updated);
      setSuccessMessage(t("spots.editSuccess"));
      // Navigate back to the spot detail after a short delay
      setTimeout(() => router.push(`/spot/${id}`), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("spots.errors.updateFailed"));
    } finally {
      setIsSaving(false);
    }
  }, [spot, title, description, selectedCompositions, customComposition, selectedColors, accessibility, id, router, t]);

  if (isLoading) {
    return (
      <div className={`${PAGE_WIDE} pb-6`}>
        <PageHeader title={t("spots.editSpot")} />
        <div className="space-y-4 pt-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (error && !spot) {
    return (
      <div className={`${PAGE_WIDE} pb-6`}>
        <PageHeader title={t("spots.editSpot")} />
        <div className="flex flex-col items-center justify-center gap-4 py-24">
          <p className="text-center text-[15px] text-error">{error}</p>
          <Button variant="secondary" onClick={() => router.back()}>
            {t("common.back")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${PAGE_WIDE} pb-6`}>
      <PageHeader title={t("spots.editSpot")} />

      <div className="space-y-6 pt-4">
        {/* Success message */}
        {successMessage ? (
          <div className="rounded-sm border border-success/20 bg-success-light px-4 py-3">
            <p className="text-sm text-success">{successMessage}</p>
          </div>
        ) : null}

        {/* Error message */}
        {error ? (
          <div className="rounded-sm border border-error/20 bg-error-light px-4 py-3">
            <p className="text-sm text-error">{error}</p>
          </div>
        ) : null}

        {/* Title */}
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

        {/* Description */}
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

        {/* Compositions */}
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

        {/* Accessibility */}
        <div>
          <SectionLabel>{t("spots.accessibilityTitle")}</SectionLabel>
          <AccessibilityPicker value={accessibility} onChange={setAccessibility} />
        </div>

        {/* Colors */}
        <div>
          <SectionLabel>{t("spots.colors")}</SectionLabel>
          <SelectionCount
            count={selectedColors.length}
            max={MAX_COLORS}
            className="mt-0.5"
          />

          {/* Preset swatches */}
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

          {/* Color picker */}
          <div className="mt-3 flex gap-2">
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
              className="flex flex-1 items-center justify-center gap-2 rounded-sm border border-border bg-bg-secondary px-2 py-3 text-sm text-text transition-colors cursor-pointer hover:bg-bg-tertiary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg className="h-[18px] w-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 0 0 5.304 0l6.401-6.402M6.75 21A3.75 3.75 0 0 1 3 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 0 0 3.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008Z" />
              </svg>
              <span className="text-center">{t("spots.pickColor")}</span>
            </button>
          </div>

          {/* Selected colors */}
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

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-border pt-6">
          <Button variant="ghost" onClick={() => router.back()}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave} loading={isSaving}>
            {t("common.save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
