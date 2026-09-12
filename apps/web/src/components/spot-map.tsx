"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  SpotClusterer,
  clusterMarkerSize,
  formatClusterCount,
  type MapBounds,
  type MapPin,
  pinColor,
} from "@trs/shared/map";
import type { LivePosition } from "@/lib/use-live-position";

/**
 * A place to move the map to. Pass a fresh object each time — the map
 * re-centres on every new one, so "locate me" answers even when the
 * photographer hasn't moved.
 */
interface MapCenter {
  lat: number;
  lng: number;
  zoom?: number;
}

/** What the map currently shows — the page fetches pins for it. */
interface MapViewport {
  bounds: MapBounds;
  zoom: number;
}

/** Copy the map needs; passed in so this component stays hook-free inside Leaflet callbacks. */
interface SpotMapLabels {
  cluster: (count: number) => string;
  untitled: string;
  open: string;
  youAreHere: string;
}

interface SpotMapProps {
  pins: MapPin[];
  center?: MapCenter | null;
  /** The photographer's live position; null hides the dot. */
  userPosition?: LivePosition | null;
  labels: SpotMapLabels;
  onSpotClick?: (pin: MapPin) => void;
  onViewportChange?: (viewport: MapViewport) => void;
}

// Default center: Paris
const DEFAULT_CENTER: [number, number] = [48.8566, 2.3522];
const DEFAULT_ZOOM = 5;
// Roughly the app's 0.05° region once the photographer is located.
const LOCATE_ZOOM = 13;
const PREVIEW_WIDTH = 220;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Leaflet = any;

/**
 * Popup chrome and marker styling. Injected once, next to the Leaflet CSS,
 * so the map owns its own look and the page stylesheet stays untouched.
 * Theme tokens throughout, so it follows dark mode.
 */
const MAP_CSS = `
.spot-pin,.spot-cluster{background:none;border:0}
.spot-cluster__badge{display:flex;align-items:center;justify-content:center;box-sizing:border-box;border-radius:9999px;background:var(--color-accent);color:var(--color-on-accent);border:3px solid var(--color-bg);box-shadow:0 0 0 4px var(--color-accent-tint);font-weight:600;font-variant-numeric:tabular-nums;cursor:pointer;transition:transform .15s}
.spot-cluster__badge:hover{transform:scale(1.06)}
.spot-preview-popup .leaflet-popup-content-wrapper{padding:0;border-radius:16px;background:var(--color-bg);box-shadow:0 8px 24px rgba(22,32,58,.18);overflow:hidden}
.spot-preview-popup .leaflet-popup-content{margin:0;width:${PREVIEW_WIDTH}px!important;line-height:1.3}
.spot-preview-popup .leaflet-popup-tip{background:var(--color-bg);box-shadow:none}
.spot-preview{display:block;color:var(--color-text);text-decoration:none;outline:none}
.spot-preview:focus-visible{box-shadow:inset 0 0 0 2px var(--color-accent)}
.spot-preview__photo{display:block;width:${PREVIEW_WIDTH}px;height:140px;object-fit:cover;background:var(--color-bg-tertiary)}
.spot-preview__body{display:flex;align-items:center;gap:10px;padding:10px 12px 12px}
.spot-preview__text{min-width:0;flex:1}
.spot-preview__title{display:block;font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.spot-preview__city{display:block;margin-top:2px;font-size:12px;color:var(--color-text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.spot-preview__chevron{flex:none;width:18px;height:18px;color:var(--color-text-tertiary);transition:color .15s}
.spot-preview:hover .spot-preview__chevron{color:var(--color-accent)}
.you-are-here{background:none;border:0;pointer-events:none}
.you-are-here__wrap{position:relative;width:20px;height:20px}
.you-are-here__halo{position:absolute;left:50%;top:50%;width:48px;height:48px;margin:-24px 0 0 -24px;border-radius:50%;background:var(--color-accent);opacity:.2;animation:you-are-here-pulse 2.4s ease-out infinite}
@keyframes you-are-here-pulse{0%{transform:scale(.5);opacity:.4}70%{transform:scale(1.2);opacity:0}100%{transform:scale(1.2);opacity:0}}
@media (prefers-reduced-motion:reduce){.you-are-here__halo{animation:none;transform:scale(.9)}}
.you-are-here__cone{position:absolute;left:50%;top:50%;width:88px;height:88px;margin:-44px 0 0 -44px;border-radius:50%;background:conic-gradient(from -30deg,var(--color-accent) 0deg,var(--color-accent) 60deg,transparent 60deg);opacity:.3;transform-origin:50% 50%;transition:transform .2s ease-out;-webkit-mask:radial-gradient(circle,transparent 11px,#000 12px);mask:radial-gradient(circle,transparent 11px,#000 12px)}
.you-are-here__cone[hidden]{display:none}
.you-are-here__dot{position:absolute;inset:0;border-radius:9999px;background:var(--color-accent);border:3px solid #fff;box-shadow:0 1px 6px rgba(22,32,58,.4)}
`;

export default function SpotMap({
  pins,
  center,
  userPosition,
  labels,
  onSpotClick,
  onViewportChange,
}: SpotMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet>(null);
  const leafletRef = useRef<Leaflet>(null);
  const layerRef = useRef<Leaflet>(null);
  const clustererRef = useRef<SpotClusterer | null>(null);
  // The "you are here" dot and its accuracy ring — created once, then moved.
  const userMarkerRef = useRef<Leaflet>(null);
  const userCircleRef = useRef<Leaflet>(null);
  const userPositionRef = useRef<LivePosition | null | undefined>(userPosition);
  // Latest callbacks/copy, so markers never need rebuilding when they change.
  const onSpotClickRef = useRef(onSpotClick);
  const onViewportChangeRef = useRef(onViewportChange);
  const labelsRef = useRef(labels);
  // A centre asked for before Leaflet finished loading — applied on init.
  const pendingCenterRef = useRef<MapCenter | null>(null);
  // The pin whose preview is open — re-opened after a redraw so a fetch
  // landing mid-read doesn't snatch the card away.
  const activePinIdRef = useRef<string | null>(null);
  const redrawingRef = useRef(false);

  useEffect(() => {
    onSpotClickRef.current = onSpotClick;
    onViewportChangeRef.current = onViewportChange;
    labelsRef.current = labels;
  }, [onSpotClick, onViewportChange, labels]);

  /** Draw clusters and lone pins for the current view. */
  const redraw = useCallback(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    const layer = layerRef.current;
    if (!map || !L || !layer) return;

    redrawingRef.current = true;
    layer.clearLayers();

    const clusterer = clustererRef.current;
    if (clusterer) {
      const zoom = map.getZoom();
      for (const item of clusterer.getItems(toBounds(map), zoom)) {
        if (item.kind === "cluster") {
          const { latitude, longitude, count, id } = item;
          const marker = L.marker([latitude, longitude], {
            icon: clusterIcon(L, count),
            title: labelsRef.current.cluster(count),
          });
          // Tapping a cluster zooms just far enough for it to split.
          marker.on("click", () =>
            map.flyTo([latitude, longitude], clusterer.getExpansionZoom(id), { duration: 0.5 }),
          );
          layer.addLayer(marker);
          continue;
        }

        const { pin } = item;
        const active = activePinIdRef.current === pin.id;
        const marker = L.marker([pin.latitude, pin.longitude], {
          icon: pinIcon(L, pin, active),
          title: pin.title ?? labelsRef.current.untitled,
          riseOnHover: true,
        });
        marker.bindPopup(
          () => previewCard(pin, labelsRef.current, () => onSpotClickRef.current?.(pin)),
          {
            className: "spot-preview-popup",
            closeButton: false,
            minWidth: PREVIEW_WIDTH,
            maxWidth: PREVIEW_WIDTH,
            offset: [0, -6],
            autoPanPadding: [24, 24],
          },
        );
        marker.on("popupopen", () => {
          activePinIdRef.current = pin.id;
          marker.setIcon(pinIcon(L, pin, true));
        });
        marker.on("popupclose", () => {
          // Closing because we're clearing the layer is not the user's doing.
          if (redrawingRef.current) return;
          activePinIdRef.current = null;
          marker.setIcon(pinIcon(L, pin, false));
        });
        layer.addLayer(marker);
        if (active) marker.openPopup();
      }
    }

    redrawingRef.current = false;
  }, []);

  const emitViewport = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    onViewportChangeRef.current?.({ bounds: toBounds(map), zoom: map.getZoom() });
  }, []);

  /** Move (or create, or remove) the "you are here" dot for the latest position. */
  const drawUser = useCallback(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!map || !L) return;
    const pos = userPositionRef.current;

    if (!pos) {
      userMarkerRef.current?.remove();
      userCircleRef.current?.remove();
      userMarkerRef.current = null;
      userCircleRef.current = null;
      return;
    }

    const latlng: [number, number] = [pos.latitude, pos.longitude];
    if (!userCircleRef.current) {
      userCircleRef.current = L.circle(latlng, {
        radius: pos.accuracy,
        weight: 1,
        opacity: 0.35,
        fillOpacity: 0.08,
        interactive: false,
      }).addTo(map);
      // Theme tokens as inline style, so the ring follows dark mode
      const el = userCircleRef.current.getElement() as SVGElement | null;
      if (el) {
        el.style.stroke = "var(--color-accent)";
        el.style.fill = "var(--color-accent)";
      }
    } else {
      userCircleRef.current.setLatLng(latlng);
      userCircleRef.current.setRadius(pos.accuracy);
    }

    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker(latlng, {
        icon: L.divIcon({
          className: "you-are-here",
          html: `<div class="you-are-here__wrap"><div class="you-are-here__halo"></div><div class="you-are-here__cone" hidden></div><div class="you-are-here__dot"></div></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        }),
        title: labelsRef.current.youAreHere,
        interactive: false,
        keyboard: false,
        pane: "you",
      }).addTo(map);
    } else {
      userMarkerRef.current.setLatLng(latlng);
    }

    const cone = userMarkerRef.current.getElement()?.querySelector(".you-are-here__cone") as
      | HTMLElement
      | null;
    if (cone) {
      cone.hidden = pos.heading === null;
      if (pos.heading !== null) cone.style.transform = `rotate(${pos.heading}deg)`;
    }
  }, []);

  useEffect(() => {
    // Load Leaflet CSS, plus ours
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    if (!document.getElementById("spot-map-css")) {
      const style = document.createElement("style");
      style.id = "spot-map-css";
      style.textContent = MAP_CSS;
      document.head.appendChild(style);
    }

    let cancelled = false;
    // The redraw scheduled by the last `moveend`, if it has not run yet
    let moveFrame = 0;

    // Dynamically import Leaflet (client-side only)
    import("leaflet").then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, { attributionControl: false }).setView(
        DEFAULT_CENTER,
        DEFAULT_ZOOM,
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      // The screen's actions sit bottom-right, like the app's, so credit
      // OpenStreetMap on the other side rather than under a button.
      L.control.attribution({ position: "bottomleft" }).addTo(map);

      mapRef.current = map;
      leafletRef.current = L;
      layerRef.current = L.layerGroup().addTo(map);
      // The photographer sits above every pin
      map.createPane("you").style.zIndex = "650";

      const pending = pendingCenterRef.current;
      if (pending) {
        pendingCenterRef.current = null;
        map.setView([pending.lat, pending.lng], pending.zoom ?? LOCATE_ZOOM);
      }

      // Every pan or zoom regroups the markers and asks the page for pins —
      // a frame later, on purpose: when a popup's auto-pan stops a pan that
      // is still running, Leaflet fires `moveend` synchronously, and
      // clearing the layer right then removes the very marker whose popup
      // it is still positioning (a crash on `layerPointToContainerPoint`).
      map.on("moveend", () => {
        cancelAnimationFrame(moveFrame);
        moveFrame = requestAnimationFrame(() => {
          moveFrame = 0;
          redraw();
          emitViewport();
        });
      });
      // Initial draw + viewport once the map has a size
      setTimeout(() => {
        redraw();
        drawUser();
        emitViewport();
      }, 100);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(moveFrame);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layerRef.current = null;
        userMarkerRef.current = null;
        userCircleRef.current = null;
      }
    };
    // Only initialize once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Move to a requested centre (the photographer's location)
  useEffect(() => {
    if (!center) return;
    const map = mapRef.current;
    if (!map) {
      pendingCenterRef.current = center;
      return;
    }
    map.flyTo([center.lat, center.lng], center.zoom ?? LOCATE_ZOOM, { duration: 0.8 });
  }, [center]);

  // New pins: rebuild the cluster index (the costly part) and redraw.
  useEffect(() => {
    clustererRef.current = pins.length > 0 ? new SpotClusterer(pins) : null;
    redraw();
  }, [pins, redraw]);

  // The photographer moved or turned.
  useEffect(() => {
    userPositionRef.current = userPosition;
    drawUser();
  }, [userPosition, drawUser]);

  // Below `lg` the map is touch-first like the app: no +/- buttons, pinch
  // to zoom. Desktop keeps Leaflet's zoom control.
  return (
    <div
      ref={containerRef}
      className="h-full w-full [&_.leaflet-control-zoom]:hidden lg:[&_.leaflet-control-zoom]:block"
    />
  );
}

function toBounds(map: Leaflet): MapBounds {
  const b = map.getBounds();
  return {
    swLat: b.getSouthWest().lat,
    swLng: b.getSouthWest().lng,
    neLat: b.getNorthEast().lat,
    neLng: b.getNorthEast().lng,
  };
}

/**
 * The app's pin: a spot in the brand blue, ringed by the page background
 * so it reads on any tile. Own spots are the full accent, followed ones
 * the lighter tint; the open one grows and gains a halo.
 */
function pinIcon(L: Leaflet, pin: MapPin, active: boolean) {
  // Big enough to read as a marker on any tile: the spot's colour inside a
  // white ring with a soft shadow; own spots add an accent ring; the open
  // one grows and gains a halo.
  const size = active ? 28 : 22;
  const fill = pinColor(pin.colors) ?? `var(${pin.isOwn ? "--color-accent" : "--color-accent-light"})`;
  const shadows = [
    pin.isOwn ? "0 0 0 2px var(--color-accent)" : null,
    active ? "0 0 0 6px var(--color-accent-tint)" : null,
    "0 2px 6px rgba(22, 32, 58, 0.35)",
  ].filter(Boolean);
  return L.divIcon({
    className: "spot-pin",
    html: `<div style="
      box-sizing: border-box;
      width: ${size}px;
      height: ${size}px;
      border-radius: 9999px;
      background: ${fill};
      border: ${active ? 4 : 3}px solid var(--color-bg);
      box-shadow: ${shadows.join(", ")};
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/** A filled dot that grows gently with its count and shows it. */
function clusterIcon(L: Leaflet, count: number) {
  const size = clusterMarkerSize(count);
  const fontSize = size >= 52 ? 15 : size >= 42 ? 14 : 13;
  return L.divIcon({
    className: "spot-cluster",
    html: `<div class="spot-cluster__badge" style="width:${size}px;height:${size}px;font-size:${fontSize}px">${formatClusterCount(count)}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/**
 * The preview card shown when a pin is tapped: the photo, the title, the
 * city — tap it to open the spot. Built with DOM APIs so user text is
 * never parsed as HTML.
 */
function previewCard(pin: MapPin, labels: SpotMapLabels, onOpen: () => void): HTMLElement {
  const title = pin.title ?? labels.untitled;

  const card = document.createElement("a");
  card.className = "spot-preview";
  card.href = `/spot/${pin.id}`;
  card.setAttribute("aria-label", `${labels.open} — ${title}`);
  card.addEventListener("click", (e) => {
    e.preventDefault();
    onOpen();
  });

  const photo = document.createElement("img");
  photo.className = "spot-preview__photo";
  photo.src = pin.photoUrl;
  photo.alt = "";
  photo.loading = "lazy";
  photo.decoding = "async";
  card.appendChild(photo);

  const body = document.createElement("div");
  body.className = "spot-preview__body";

  const text = document.createElement("div");
  text.className = "spot-preview__text";
  const titleEl = document.createElement("span");
  titleEl.className = "spot-preview__title";
  titleEl.textContent = title;
  text.appendChild(titleEl);
  if (pin.city) {
    const cityEl = document.createElement("span");
    cityEl.className = "spot-preview__city";
    cityEl.textContent = pin.city;
    text.appendChild(cityEl);
  }
  body.appendChild(text);

  const chevron = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  chevron.setAttribute("class", "spot-preview__chevron");
  chevron.setAttribute("viewBox", "0 0 24 24");
  chevron.setAttribute("fill", "none");
  chevron.setAttribute("stroke", "currentColor");
  chevron.setAttribute("stroke-width", "2");
  chevron.setAttribute("aria-hidden", "true");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  path.setAttribute("d", "M9 5l7 7-7 7");
  chevron.appendChild(path);
  body.appendChild(chevron);

  card.appendChild(body);
  return card;
}

export type { MapBounds, MapCenter, MapViewport, SpotMapLabels };
