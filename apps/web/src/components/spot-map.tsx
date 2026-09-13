"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Map as GLMap, Marker as GLMarker, Popup as GLPopup } from "maplibre-gl";
import {
  SpotClusterer,
  clusterMarkerSize,
  formatClusterCount,
  type MapBounds,
  type MapPin,
  pinColor,
} from "@trs/shared/map";
import type { LivePosition } from "@/lib/use-live-position";
import { createMap, fromGLZoom, maplibre, toGLZoom } from "@/lib/map-engine";
import { loadStyle, watchMapTheme } from "@/lib/map-tiles";

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
  /** Where the map is pointed, as the map itself has it. */
  center: { lat: number; lng: number };
}

/** Copy the map needs; passed in so this component stays hook-free inside map callbacks. */
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

// Default center: Paris, in the order MapLibre reads a point.
const DEFAULT_CENTER: [number, number] = [2.3522, 48.8566];
const DEFAULT_ZOOM = 5;
// Roughly the app's 0.05° region once the photographer is located.
const LOCATE_ZOOM = 13;
const PREVIEW_WIDTH = 220;
/** The Earth's circumference, for turning metres of accuracy into pixels. */
const EQUATOR_METERS = 40075016.686;

/**
 * Popup chrome and marker styling. Injected once, so the map owns its own
 * look and the page stylesheet stays untouched. Theme tokens throughout,
 * so it follows dark mode.
 */
const MAP_CSS = `
.spot-pin,.spot-cluster{cursor:pointer}
.spot-cluster__badge{display:flex;align-items:center;justify-content:center;box-sizing:border-box;border-radius:9999px;background:var(--color-accent);color:var(--color-on-accent);border:3px solid var(--color-bg);box-shadow:0 0 0 4px var(--color-accent-tint);font-weight:600;font-variant-numeric:tabular-nums;transition:transform .15s}
.spot-cluster__badge:hover{transform:scale(1.06)}
.spot-preview-popup .maplibregl-popup-content{padding:0;border-radius:16px;background:var(--color-bg);box-shadow:0 8px 24px rgba(22,32,58,.18);overflow:hidden;width:${PREVIEW_WIDTH}px;line-height:1.3}
.spot-preview-popup .maplibregl-popup-tip{display:none}
.spot-preview{display:block;color:var(--color-text);text-decoration:none;outline:none}
.spot-preview:focus-visible{box-shadow:inset 0 0 0 2px var(--color-accent)}
.spot-preview__photo{display:block;width:${PREVIEW_WIDTH}px;height:140px;object-fit:cover;background:var(--color-bg-tertiary)}
.spot-preview__body{display:flex;align-items:center;gap:10px;padding:10px 12px 12px}
.spot-preview__text{min-width:0;flex:1}
.spot-preview__title{display:block;font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.spot-preview__city{display:block;margin-top:2px;font-size:12px;color:var(--color-text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.spot-preview__chevron{flex:none;width:18px;height:18px;color:var(--color-text-tertiary);transition:color .15s}
.spot-preview:hover .spot-preview__chevron{color:var(--color-accent)}
.you-are-here{pointer-events:none;z-index:3}
.you-are-here__wrap{position:relative;width:20px;height:20px}
.you-are-here__accuracy{position:absolute;left:50%;top:50%;width:0;height:0;border-radius:50%;background:var(--color-accent);opacity:.12;transform:translate(-50%,-50%)}
.you-are-here__halo{position:absolute;left:50%;top:50%;width:48px;height:48px;margin:-24px 0 0 -24px;border-radius:50%;background:var(--color-accent);opacity:.2;animation:you-are-here-pulse 2.4s ease-out infinite}
@keyframes you-are-here-pulse{0%{transform:scale(.5);opacity:.4}70%{transform:scale(1.2);opacity:0}100%{transform:scale(1.2);opacity:0}}
@media (prefers-reduced-motion:reduce){.you-are-here__halo{animation:none;transform:scale(.9)}}
.you-are-here__cone{position:absolute;left:50%;top:50%;width:88px;height:88px;margin:-44px 0 0 -44px;border-radius:50%;background:conic-gradient(from -30deg,var(--color-accent) 0deg,var(--color-accent) 60deg,transparent 60deg);opacity:.3;transform-origin:50% 50%;transition:transform .2s ease-out;-webkit-mask:radial-gradient(circle,transparent 11px,#000 12px);mask:radial-gradient(circle,transparent 11px,#000 12px)}
.you-are-here__cone[hidden]{display:none}
.you-are-here__dot{position:absolute;inset:0;border-radius:9999px;background:var(--color-accent);border:3px solid #fff;box-shadow:0 1px 6px rgba(22,32,58,.4)}
`;

/** The MapLibre namespace, once loaded — markers and popups are built from it. */
type MapLibre = Awaited<ReturnType<typeof maplibre>>;

export default function SpotMap({
  pins,
  center,
  userPosition,
  labels,
  onSpotClick,
  onViewportChange,
}: SpotMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GLMap | null>(null);
  const glRef = useRef<MapLibre | null>(null);
  const clustererRef = useRef<SpotClusterer | null>(null);
  // Every marker currently on the map, cleared and rebuilt on each redraw.
  const markersRef = useRef<GLMarker[]>([]);
  // The pin elements by id, so the open one can be restyled without a redraw.
  const pinElementsRef = useRef(new Map<string, HTMLElement>());
  // One preview card at a time, anchored to a point rather than to a marker,
  // so regrouping the pins underneath never snatches it away.
  const popupRef = useRef<GLPopup | null>(null);
  const activePinRef = useRef<MapPin | null>(null);
  // The "you are here" dot and the ring of its accuracy — created once, then moved.
  const userMarkerRef = useRef<GLMarker | null>(null);
  const userAccuracyRef = useRef<HTMLElement | null>(null);
  const userPositionRef = useRef<LivePosition | null | undefined>(userPosition);
  // Latest callbacks/copy, so markers never need rebuilding when they change.
  const onSpotClickRef = useRef(onSpotClick);
  const onViewportChangeRef = useRef(onViewportChange);
  const labelsRef = useRef(labels);
  // A centre asked for before MapLibre finished loading — applied on init.
  const pendingCenterRef = useRef<MapCenter | null>(null);

  useEffect(() => {
    onSpotClickRef.current = onSpotClick;
    onViewportChangeRef.current = onViewportChange;
    labelsRef.current = labels;
  }, [onSpotClick, onViewportChange, labels]);

  /** Put the preview card away and let its pin shrink back. */
  const closePreview = useCallback(() => {
    const pin = activePinRef.current;
    activePinRef.current = null;
    popupRef.current?.remove();
    if (pin) {
      const element = pinElementsRef.current.get(pin.id);
      if (element) paintPin(element, pin, false);
    }
  }, []);

  /** Show the preview card for a pin, and grow the pin under it. */
  const openPreview = useCallback(
    (pin: MapPin) => {
      const map = mapRef.current;
      const popup = popupRef.current;
      if (!map || !popup) return;
      closePreview();
      activePinRef.current = pin;
      const element = pinElementsRef.current.get(pin.id);
      if (element) paintPin(element, pin, true);
      popup
        .setLngLat([pin.longitude, pin.latitude])
        .setDOMContent(previewCard(pin, labelsRef.current, () => onSpotClickRef.current?.(pin)))
        .addTo(map);
    },
    [closePreview],
  );

  /** Draw clusters and lone pins for the current view. */
  const redraw = useCallback(() => {
    const map = mapRef.current;
    const gl = glRef.current;
    if (!map || !gl) return;

    for (const marker of markersRef.current) marker.remove();
    markersRef.current = [];
    pinElementsRef.current.clear();

    const clusterer = clustererRef.current;
    if (!clusterer) {
      if (activePinRef.current) closePreview();
      return;
    }

    const zoom = fromGLZoom(map.getZoom());
    for (const item of clusterer.getItems(toBounds(map), zoom)) {
      if (item.kind === "cluster") {
        const { latitude, longitude, count, id } = item;
        const element = clusterElement(count, labelsRef.current.cluster(count));
        // Tapping a cluster zooms just far enough for it to split.
        element.addEventListener("click", (e) => {
          e.stopPropagation();
          map.flyTo({
            center: [longitude, latitude],
            zoom: toGLZoom(clusterer.getExpansionZoom(id)),
            duration: 500,
          });
        });
        markersRef.current.push(
          new gl.Marker({ element }).setLngLat([longitude, latitude]).addTo(map),
        );
        continue;
      }

      const { pin } = item;
      const active = activePinRef.current?.id === pin.id;
      const element = pinElement(pin, active, pin.title ?? labelsRef.current.untitled);
      element.addEventListener("click", (e) => {
        e.stopPropagation();
        if (activePinRef.current?.id === pin.id) closePreview();
        else openPreview(pin);
      });
      pinElementsRef.current.set(pin.id, element);
      markersRef.current.push(
        new gl.Marker({ element }).setLngLat([pin.longitude, pin.latitude]).addTo(map),
      );
    }

    // A pin swallowed by a cluster takes its preview card with it.
    const open = activePinRef.current;
    if (open && !pinElementsRef.current.has(open.id)) closePreview();
  }, [closePreview, openPreview]);

  const emitViewport = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const { lat, lng } = map.getCenter();
    onViewportChangeRef.current?.({
      bounds: toBounds(map),
      zoom: fromGLZoom(map.getZoom()),
      center: { lat, lng },
    });
  }, []);

  /** The accuracy ring is drawn in metres, so it is resized at every zoom. */
  const sizeAccuracyRing = useCallback(() => {
    const map = mapRef.current;
    const pos = userPositionRef.current;
    const ring = userAccuracyRef.current;
    if (!map || !pos || !ring) return;
    // MapLibre counts zoom in 512px tiles, so that is the width of the world.
    const metersPerPixel =
      (EQUATOR_METERS * Math.cos((pos.latitude * Math.PI) / 180)) / (512 * 2 ** map.getZoom());
    const diameter = Math.min((2 * pos.accuracy) / metersPerPixel, 2000);
    ring.style.width = `${diameter}px`;
    ring.style.height = `${diameter}px`;
  }, []);

  /** Move (or create, or remove) the "you are here" dot for the latest position. */
  const drawUser = useCallback(() => {
    const map = mapRef.current;
    const gl = glRef.current;
    if (!map || !gl) return;
    const pos = userPositionRef.current;

    if (!pos) {
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      userAccuracyRef.current = null;
      return;
    }

    const at: [number, number] = [pos.longitude, pos.latitude];
    if (!userMarkerRef.current) {
      const element = document.createElement("div");
      element.className = "you-are-here";
      element.title = labelsRef.current.youAreHere;
      const wrap = element.appendChild(document.createElement("div"));
      wrap.className = "you-are-here__wrap";
      // The ring of accuracy, the pulse, the cone of heading, the dot
      for (const part of ["accuracy", "halo", "cone", "dot"]) {
        const layer = wrap.appendChild(document.createElement("div"));
        layer.className = `you-are-here__${part}`;
        if (part === "cone") layer.hidden = true;
      }
      userAccuracyRef.current = wrap.querySelector(".you-are-here__accuracy");
      userMarkerRef.current = new gl.Marker({ element }).setLngLat(at).addTo(map);
    } else {
      userMarkerRef.current.setLngLat(at);
    }
    sizeAccuracyRing();

    const cone = userMarkerRef.current
      .getElement()
      .querySelector<HTMLElement>(".you-are-here__cone");
    if (cone) {
      cone.hidden = pos.heading === null;
      if (pos.heading !== null) cone.style.transform = `rotate(${pos.heading}deg)`;
    }
  }, [sizeAccuracyRing]);

  useEffect(() => {
    if (!document.getElementById("spot-map-css")) {
      const style = document.createElement("style");
      style.id = "spot-map-css";
      style.textContent = MAP_CSS;
      document.head.appendChild(style);
    }

    let cancelled = false;
    // Held here so the teardown empties the very map the effect filled
    const pinElements = pinElementsRef.current;
    // The redraw scheduled by the last `moveend`, if it has not run yet
    let moveFrame = 0;
    let stopThemeWatch = () => {};
    let firstDraw: ReturnType<typeof setTimeout> | undefined;

    void Promise.all([
      maplibre(),
      createMap({
        container: containerRef.current!,
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        // The screen's own actions sit bottom-right, so credit
        // OpenStreetMap on the other side rather than under a button.
        attributionPosition: "bottom-left",
      }),
    ]).then(([gl, map]) => {
      if (cancelled) {
        map.remove();
        return;
      }
      mapRef.current = map;
      glRef.current = gl;
      popupRef.current = new gl.Popup({
        className: "spot-preview-popup",
        closeButton: false,
        closeOnClick: true,
        maxWidth: `${PREVIEW_WIDTH}px`,
        offset: 16,
      });
      // Dismissed by a tap on the map, not by us: let the pin shrink back.
      popupRef.current.on("close", () => {
        if (activePinRef.current) closePreview();
      });

      map.addControl(new gl.NavigationControl({ showCompass: false }), "top-left");
      stopThemeWatch = watchMapTheme((dark) => {
        void loadStyle(dark).then((style) => map.setStyle(style as never));
      });

      const pending = pendingCenterRef.current;
      if (pending) {
        pendingCenterRef.current = null;
        map.jumpTo({ center: [pending.lng, pending.lat], zoom: toGLZoom(pending.zoom ?? LOCATE_ZOOM) });
      }

      // Every pan or zoom regroups the markers and asks the page for pins —
      // a frame later, on purpose, so a redraw never lands in the middle of
      // the movement that triggered it.
      map.on("moveend", () => {
        cancelAnimationFrame(moveFrame);
        moveFrame = requestAnimationFrame(() => {
          moveFrame = 0;
          redraw();
          emitViewport();
        });
      });
      map.on("zoom", sizeAccuracyRing);

      // Initial draw + viewport once the map has a size
      firstDraw = setTimeout(() => {
        redraw();
        drawUser();
        emitViewport();
      }, 100);
    })
      // A map that cannot be built — no WebGL, a page already gone — is
      // not the photographer's problem: the screen stands without it.
      .catch(() => {});

    return () => {
      cancelled = true;
      cancelAnimationFrame(moveFrame);
      clearTimeout(firstDraw);
      stopThemeWatch();
      popupRef.current?.remove();
      popupRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current = [];
      pinElements.clear();
      userMarkerRef.current = null;
      userAccuracyRef.current = null;
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
    map.flyTo({
      center: [center.lng, center.lat],
      zoom: toGLZoom(center.zoom ?? LOCATE_ZOOM),
      duration: 800,
    });
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
  // to zoom. Desktop keeps the zoom control.
  return (
    <div
      ref={containerRef}
      className="h-full w-full [&_.maplibregl-ctrl-group]:hidden lg:[&_.maplibregl-ctrl-group]:block"
    />
  );
}

function toBounds(map: GLMap): MapBounds {
  const b = map.getBounds();
  return {
    swLat: b.getSouthWest().lat,
    swLng: b.getSouthWest().lng,
    neLat: b.getNorthEast().lat,
    neLng: b.getNorthEast().lng,
  };
}

/**
 * The app's pin: a spot in its own first colour, ringed by the page
 * background so it reads on any basemap. Own spots add an accent ring;
 * the open one grows and gains a halo.
 */
function paintPin(element: HTMLElement, pin: MapPin, active: boolean) {
  const size = active ? 28 : 22;
  const fill = pinColor(pin.colors) ?? `var(${pin.isOwn ? "--color-accent" : "--color-accent-light"})`;
  const shadows = [
    pin.isOwn ? "0 0 0 2px var(--color-accent)" : null,
    active ? "0 0 0 6px var(--color-accent-tint)" : null,
    "0 2px 6px rgba(22, 32, 58, 0.35)",
  ].filter(Boolean);
  element.style.boxSizing = "border-box";
  element.style.width = `${size}px`;
  element.style.height = `${size}px`;
  element.style.borderRadius = "9999px";
  element.style.background = fill;
  element.style.border = `${active ? 4 : 3}px solid var(--color-bg)`;
  element.style.boxShadow = shadows.join(", ");
}

function pinElement(pin: MapPin, active: boolean, title: string): HTMLElement {
  const element = document.createElement("div");
  element.className = "spot-pin";
  element.title = title;
  element.setAttribute("data-pin", pin.id);
  paintPin(element, pin, active);
  return element;
}

/** A filled dot that grows gently with its count and shows it. */
function clusterElement(count: number, title: string): HTMLElement {
  const size = clusterMarkerSize(count);
  const fontSize = size >= 52 ? 15 : size >= 42 ? 14 : 13;
  const element = document.createElement("div");
  element.className = "spot-cluster";
  element.title = title;
  element.setAttribute("data-cluster", String(count));
  const badge = document.createElement("div");
  badge.className = "spot-cluster__badge";
  badge.style.width = `${size}px`;
  badge.style.height = `${size}px`;
  badge.style.fontSize = `${fontSize}px`;
  badge.textContent = formatClusterCount(count);
  element.appendChild(badge);
  return element;
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
