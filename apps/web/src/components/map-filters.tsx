"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  FILTER_PALETTE,
  COMPOSITION_TYPES,
  PROXIMITY_RADII_KM,
  SPOT_ACCESSIBILITY,
} from "@trs/shared/constants";
import { EMPTY_FILTERS, countActiveFilters, type MapFilters } from "@trs/shared/map";
import { CompositionIcon } from "@/components/composition-icon";
import { Drawer } from "@/components/drawer";
import { useIsDesktop } from "@/lib/use-media-query";
import { useT } from "@/lib/use-t";

interface MapFiltersMenuProps {
  filters: MapFilters;
  onChange: (filters: MapFilters) => void;
  /** Whether "around me" can be honoured right now. */
  hasPosition: boolean;
  /** A radius was picked without a position — go and get one. */
  onRequestPosition: () => void;
}

const PALETTE_HEXES = new Set<string>(FILTER_PALETTE.map((c) => c.hex));
/** The wheel button: a small hue circle, the one place a spectrum belongs. */
const COLOR_WHEEL =
  "conic-gradient(from 0deg, #E53935, #FDD835, #43A047, #00ACC1, #1E88E5, #8E24AA, #E53935)";

function toggle<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/**
 * The map's filter menu: a pill that counts what is active and drops a
 * panel with colours, compositions, accessibility and an "around me"
 * radius. Every change applies at once; "Done" just closes the panel.
 */
export function MapFiltersMenu({
  filters,
  onChange,
  hasPosition,
  onRequestPosition,
}: MapFiltersMenuProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const isDesktop = useIsDesktop();
  const active = countActiveFilters(filters);

  // Outside click or Escape closes the panel
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const panel = (
    <FiltersPanel
      filters={filters}
      onChange={onChange}
      hasPosition={hasPosition}
      onRequestPosition={onRequestPosition}
      onDone={() => setOpen(false)}
    />
  );

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors cursor-pointer ${
          active > 0
            ? "border-accent bg-accent-tint text-accent"
            : "border-border bg-bg text-text-secondary hover:text-text"
        }`}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
        </svg>
        {t("map.filters")}
        {active > 0 ? (
          <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-on-accent">
            {active}
          </span>
        ) : null}
      </button>

      {/* Phones: a drawer pulled up over a dimmed map; desktop: a dropdown */}
      {isDesktop ? (
        open ? (
          <div
            id={panelId}
            role="dialog"
            aria-label={t("map.filters")}
            className="absolute right-0 top-11 z-[1100] flex max-h-[calc(100vh-8rem)] w-[340px] flex-col rounded-md border border-border bg-bg shadow-float"
          >
            {panel}
          </div>
        ) : null
      ) : (
        <Drawer
          id={panelId}
          open={open}
          onClose={() => setOpen(false)}
          label={t("map.filters")}
          className="max-h-[85dvh]"
        >
          {panel}
        </Drawer>
      )}
    </div>
  );
}

/** The options and the footer — the same inside a drawer or a dropdown. */
function FiltersPanel({
  filters,
  onChange,
  hasPosition,
  onRequestPosition,
  onDone,
}: MapFiltersMenuProps & { onDone: () => void }) {
  const t = useT();
  const active = countActiveFilters(filters);

  const pickRadius = (radiusKm: number | null) => {
    onChange({ ...filters, radiusKm });
    if (radiusKm && !hasPosition) onRequestPosition();
  };

  // Anything chosen that is not a palette swatch came from the wheel
  const customColors = filters.colors.filter((hex) => !PALETTE_HEXES.has(hex));

  const addColor = (raw: string) => {
    const hex = raw.trim().toUpperCase();
    if (!/^#[0-9A-F]{6}$/.test(hex) || filters.colors.includes(hex)) return;
    onChange({ ...filters, colors: [...filters.colors, hex] });
  };

  const swatch = (hex: string, label: string) => {
    const selected = filters.colors.includes(hex);
    return (
      <button
        key={hex}
        type="button"
        aria-pressed={selected}
        aria-label={label}
        title={label}
        onClick={() => onChange({ ...filters, colors: toggle(filters.colors, hex) })}
        className={`h-8 w-8 rounded-full transition-transform cursor-pointer ${
          selected ? "scale-105 ring-2 ring-accent ring-offset-2 ring-offset-bg" : "border border-border"
        }`}
        style={{ backgroundColor: hex }}
      />
    );
  };

  return (
    <>
          {/* Everything scrolls; the footer stays put, so "Done" is always in reach */}
          <div data-testid="filters-scroll" className="min-h-0 flex-1 overflow-y-auto p-4">
          <Section title={t("map.filterColors")}>
            <div className="flex flex-wrap gap-2">
              {FILTER_PALETTE.map(({ key, hex }) => swatch(hex, t(`colorFamilies.${key}`)))}
              {/* Colours picked on the wheel sit after the palette */}
              {customColors.map((hex) => swatch(hex, hex))}
              {/* The picker input lies over the wheel: a real tap opens the native
                  picker everywhere (iOS ignores a scripted click on a hidden input) */}
              <span
                className="relative h-8 w-8 rounded-full border border-border transition-transform hover:scale-105"
                style={{ background: COLOR_WHEEL }}
                title={t("spots.pickColor")}
                data-testid="filters-color-wheel"
              >
                <input
                  type="color"
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  aria-label={t("spots.pickColor")}
                  onChange={(e) => addColor(e.target.value)}
                  data-testid="filters-color-input"
                />
              </span>
            </div>
          </Section>

          <Section title={t("map.filterCompositions")}>
            <div className="flex flex-wrap gap-1.5">
              {COMPOSITION_TYPES.map((comp) => (
                <Chip
                  key={comp}
                  selected={filters.compositions.includes(comp)}
                  onClick={() =>
                    onChange({ ...filters, compositions: toggle(filters.compositions, comp) })
                  }
                >
                  <CompositionIcon type={comp} className="h-4 w-4" />
                  {t(`compositions.${comp}`)}
                </Chip>
              ))}
            </div>
          </Section>

          <Section title={t("map.filterAccessibility")}>
            <div className="flex flex-wrap gap-1.5">
              {SPOT_ACCESSIBILITY.map((level) => (
                <Chip
                  key={level}
                  selected={filters.accessibility.includes(level)}
                  onClick={() =>
                    onChange({ ...filters, accessibility: toggle(filters.accessibility, level) })
                  }
                >
                  {t(`spots.accessibilityLevel.${level}`)}
                </Chip>
              ))}
            </div>
          </Section>

          <Section title={t("map.filterProximity")}>
            <div className="flex flex-wrap gap-1.5">
              <Chip selected={filters.radiusKm === null} onClick={() => pickRadius(null)}>
                {t("map.anywhere")}
              </Chip>
              {PROXIMITY_RADII_KM.map((km) => (
                <Chip key={km} selected={filters.radiusKm === km} onClick={() => pickRadius(km)}>
                  {t("map.withinKm", { km: String(km) })}
                </Chip>
              ))}
            </div>
            {filters.radiusKm && !hasPosition ? (
              <p className="mt-2 text-xs text-text-secondary">{t("map.needLocation")}</p>
            ) : null}
          </Section>

          </div>

          <div className="flex shrink-0 items-center justify-between border-t border-border px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={() => onChange(EMPTY_FILTERS)}
              disabled={active === 0}
              className="text-[13px] font-medium text-text-secondary transition-colors cursor-pointer hover:text-text disabled:cursor-default disabled:opacity-40"
            >
              {t("map.filtersReset")}
            </button>
            <button
              type="button"
              onClick={onDone}
              className="rounded-full bg-text px-4 py-1.5 text-[13px] font-medium text-bg cursor-pointer"
            >
              {t("map.filtersDone")}
            </button>
          </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="[&+&]:mt-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-[0.5px] text-text-secondary">{title}</p>
      {children}
    </div>
  );
}

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] transition-colors cursor-pointer ${
        selected
          ? "border-accent bg-accent-tint text-accent"
          : "border-border bg-bg text-text-secondary hover:text-text"
      }`}
    >
      {children}
    </button>
  );
}
