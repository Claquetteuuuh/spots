"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DICEBEAR_STYLES,
  DICEBEAR_BG_COLORS,
  dicebearUrl,
} from "@trs/shared/constants";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/use-t";

// ─── Types ──────────────────────────────────────────────────────────

interface AvatarPickerProps {
  open: boolean;
  onClose: () => void;
  /** Called with the chosen DiceBear URL (or `null` to remove). */
  onSelect: (url: string | null) => void;
  /** Default seed — typically the user's username. */
  seed: string;
  /** Pre-selected URL to initialise from (parse style + bg if possible). */
  currentUrl?: string | null;
}

// ─── Helpers ────────────────────────────────────────────────────────

/** Try to extract the style and bg colour from an existing DiceBear URL. */
function parseDicebearUrl(url: string | null | undefined) {
  if (!url) return null;
  const match = url.match(
    /api\.dicebear\.com\/\d+\.x\/([^/]+)\/svg\?.*backgroundColor=([a-f0-9]{6})/i,
  );
  if (!match) return null;
  return { style: match[1], bg: match[2] };
}

function randomSeed(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ─── Component ──────────────────────────────────────────────────────

export function AvatarPicker({
  open,
  onClose,
  onSelect,
  seed,
  currentUrl,
}: AvatarPickerProps) {
  const t = useT();
  const backdropRef = useRef<HTMLDivElement>(null);

  // Initialise from current URL if it's a DiceBear URL
  const parsed = parseDicebearUrl(currentUrl);

  const [selectedStyle, setSelectedStyle] = useState<string>(
    parsed?.style ?? DICEBEAR_STYLES[0],
  );
  const [selectedBg, setSelectedBg] = useState<string>(
    parsed?.bg ?? DICEBEAR_BG_COLORS[0],
  );
  const [currentSeed, setCurrentSeed] = useState(seed);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      const p = parseDicebearUrl(currentUrl);
      setSelectedStyle(p?.style ?? DICEBEAR_STYLES[0]);
      setSelectedBg(p?.bg ?? DICEBEAR_BG_COLORS[0]);
      setCurrentSeed(seed);
    }
  }, [open, currentUrl, seed]);

  const previewUrl = useMemo(
    () => dicebearUrl(selectedStyle, currentSeed, selectedBg),
    [selectedStyle, currentSeed, selectedBg],
  );

  // All style variants for the current seed + bg
  const styleGrid = useMemo(
    () =>
      DICEBEAR_STYLES.map((style) => ({
        style,
        url: dicebearUrl(style, currentSeed, selectedBg),
      })),
    [currentSeed, selectedBg],
  );

  const handleSave = useCallback(() => {
    onSelect(previewUrl);
    onClose();
  }, [previewUrl, onSelect, onClose]);

  const handleRandom = useCallback(() => {
    setCurrentSeed(randomSeed());
  }, []);

  const handleRemove = useCallback(() => {
    onSelect(null);
    onClose();
  }, [onSelect, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={backdropRef}
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ backgroundColor: "rgba(0,0,0,0)" }}
          animate={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          exit={{ backgroundColor: "rgba(0,0,0,0)" }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            if (e.target === backdropRef.current) onClose();
          }}
        >
          <motion.div
            className="fixed inset-0 flex flex-col overflow-hidden bg-bg pb-[env(safe-area-inset-bottom)]
              lg:relative lg:inset-auto lg:mx-0 lg:w-full lg:max-w-lg lg:max-h-[85vh] lg:rounded-2xl lg:border lg:border-border lg:pb-0"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
              mass: 0.5,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <button
                type="button"
                onClick={onClose}
                aria-label={t("common.close")}
                className="order-first lg:order-last w-8 h-8 flex items-center justify-center text-text lg:text-text-secondary lg:hover:text-text transition-colors cursor-pointer"
              >
                <svg
                  className="h-6 w-6 lg:h-5 lg:w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <h2 className="flex-1 truncate text-center text-base font-semibold text-text">
                {t("avatar.pickTitle")}
              </h2>
              <div className="w-8 order-last lg:order-first" />
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              {/* Live preview */}
              <div className="flex flex-col items-center gap-3 py-6">
                <img
                  src={previewUrl}
                  alt=""
                  className="h-24 w-24 rounded-full border-2 border-border object-cover"
                />
                <button
                  type="button"
                  onClick={handleRandom}
                  className="flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-accent-dark transition-colors cursor-pointer"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  {t("avatar.random")}
                </button>
              </div>

              {/* Style picker — label */}
              <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                {t("avatar.style")}
              </p>

              {/* Style grid */}
              <div className="grid grid-cols-3 gap-3 px-4 pb-5">
                {styleGrid.map(({ style, url }) => {
                  const active = style === selectedStyle;
                  return (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setSelectedStyle(style)}
                      className={`flex flex-col items-center gap-1.5 rounded-xl p-2 transition-colors cursor-pointer ${
                        active
                          ? "bg-accent-tint ring-2 ring-accent"
                          : "bg-bg-secondary hover:bg-bg-tertiary"
                      }`}
                    >
                      <img
                        src={url}
                        alt=""
                        className="h-14 w-14 rounded-full object-cover"
                      />
                      <span
                        className={`text-[11px] font-medium truncate max-w-full ${
                          active ? "text-accent-dark" : "text-text-secondary"
                        }`}
                      >
                        {style}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Background colour picker */}
              <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                {t("avatar.bgColor")}
              </p>
              <div className="flex gap-3 px-4 pb-6">
                {DICEBEAR_BG_COLORS.map((bg) => {
                  const active = bg === selectedBg;
                  return (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => setSelectedBg(bg)}
                      className={`h-9 w-9 rounded-full transition-all cursor-pointer ${
                        active
                          ? "ring-2 ring-accent ring-offset-2 ring-offset-bg scale-110"
                          : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: `#${bg}` }}
                      aria-label={`#${bg}`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex flex-col gap-2 px-4 py-3 border-t border-border">
              <Button
                type="button"
                fullWidth
                size="md"
                onClick={handleSave}
              >
                {t("common.save")}
              </Button>
              {currentUrl && (
                <Button
                  type="button"
                  fullWidth
                  size="md"
                  variant="ghost"
                  onClick={handleRemove}
                >
                  {t("avatar.removeAvatar")}
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
