"use client";

import { useEffect, useState } from "react";
import { formatCoordinates, navigationLinks } from "@trs/shared/map";
import { useT } from "@/lib/use-t";

interface LocationDetailsProps {
  latitude: number;
  longitude: number;
  address: string | null;
  className?: string;
}

/** How long "Copied" stays up. */
const COPIED_MS = 1500;

/**
 * Where the spot is, in words and in numbers: the address (tap to copy),
 * the coordinates underneath in small type (tap to copy), and a way to
 * open directions in Google Maps, Apple Maps or Waze.
 */
export function LocationDetails({ latitude, longitude, address, className = "" }: LocationDetailsProps) {
  const t = useT();
  const [copied, setCopied] = useState<"address" | "coords" | null>(null);
  const coords = formatCoordinates(latitude, longitude);
  const links = navigationLinks(latitude, longitude);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(null), COPIED_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async (what: "address" | "coords", text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
    } catch {
      // No clipboard here (an old browser, an insecure origin): nothing to say
    }
  };

  const copyButton = "block w-full cursor-pointer text-left transition-colors hover:text-accent";
  const apps = [
    { key: "google", label: t("common.googleMaps"), href: links.google },
    { key: "apple", label: t("common.appleMaps"), href: links.apple },
    { key: "waze", label: t("common.waze"), href: links.waze },
  ];

  return (
    <div className={`space-y-3 ${className}`} data-testid="location-details">
      <div>
        {address ? (
          <button
            type="button"
            onClick={() => copy("address", address)}
            title={t("spots.copyAddress")}
            aria-label={t("spots.copyAddress")}
            className={`${copyButton} text-[15px] text-text`}
            data-testid="copy-address"
          >
            {copied === "address" ? t("common.copied") : address}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => copy("coords", coords)}
          title={t("spots.copyCoordinates")}
          aria-label={t("spots.copyCoordinates")}
          className={`${copyButton} mt-0.5 font-mono text-[11px] text-text-tertiary`}
          data-testid="copy-coordinates"
        >
          {copied === "coords" ? t("common.copied") : coords}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-text-secondary">{t("common.openIn")}</span>
        {apps.map((app) => (
          <a
            key={app.key}
            href={app.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center rounded-full border border-border bg-bg px-3 text-[13px] font-medium text-text transition-colors hover:border-accent hover:text-accent"
            data-testid={`open-${app.key}`}
          >
            {app.label}
          </a>
        ))}
      </div>
    </div>
  );
}
