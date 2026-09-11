"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  COLOR_FAMILIES,
  COMPOSITION_TYPES,
  PROXIMITY_RADII_KM,
  SPOT_ACCESSIBILITY,
} from "@trs/shared/constants";
import { EMPTY_FILTERS, countActiveFilters, type MapFilters } from "@trs/shared/map";
import { CompositionIcon } from "@/components/composition-icon";
import { useT } from "@/lib/use-t";

interface MapFiltersMenuProps {
  filters: MapFilters;
  onChange: (filters: MapFilters) => void;
  /** Whether "around me" can be honoured right now. */
  hasPosition: boolean;
  /** A radius was picked without a position — go and get one. */
  onRequestPosition: () => void;
}

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

  const pickRadius = (radiusKm: number | null) => {
    onChange({ ...filters, radiusKm });
    if (radiusKm && !hasPosition) onRequestPosition();
  };

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

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label={t("map.filters")}
          className="absolute right-0 top-11 z-[1100] w-[min(92vw,340px)] rounded-md border border-border bg-bg p-4 shadow-float"
        >
          <Section title={t("map.filterColors")}>
            <div className="flex flex-wrap gap-2">
              {COLOR_FAMILIES.map(({ key, swatch }) => {
                const selected = filters.colors.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={selected}
                    aria-label={t(`colorFamilies.${key}`)}
                    title={t(`colorFamilies.${key}`)}
                    onClick={() => onChange({ ...filters, colors: toggle(filters.colors, key) })}
                    className={`h-8 w-8 rounded-full transition-transform cursor-pointer ${
                      selected
                        ? "scale-105 ring-2 ring-accent ring-offset-2 ring-offset-bg"
                        : "border border-border"
                    }`}
                    style={{ backgroundColor: swatch }}
                  />
                );
              })}
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

          <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
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
              onClick={() => setOpen(false)}
              className="rounded-full bg-text px-4 py-1.5 text-[13px] font-medium text-bg cursor-pointer"
            >
              {t("map.filtersDone")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
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
