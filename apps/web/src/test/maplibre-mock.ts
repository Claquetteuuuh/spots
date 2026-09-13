/**
 * A MapLibre stand-in for jsdom, which has no WebGL: the real library
 * refuses to start without a GPU context. It keeps the parts the app
 * actually uses — a centre and a zoom, DOM markers, one popup at a time —
 * so component tests can click a pin and read the card that opens.
 */
type Handler = (payload?: unknown) => void;

class Evented {
  readonly handlers = new Map<string, Set<Handler>>();

  on(event: string, handler: Handler): this {
    const set = this.handlers.get(event) ?? new Set<Handler>();
    set.add(handler);
    this.handlers.set(event, set);
    return this;
  }

  once(event: string, handler: Handler): this {
    const wrapped: Handler = (payload) => {
      this.off(event, wrapped);
      handler(payload);
    };
    return this.on(event, wrapped);
  }

  off(event: string, handler: Handler): this {
    this.handlers.get(event)?.delete(handler);
    return this;
  }

  /** Play an event the real map would fire. */
  fire(event: string, payload?: unknown): this {
    for (const handler of [...(this.handlers.get(event) ?? [])]) handler(payload);
    return this;
  }
}

/** Half a degree either side of the centre: enough for pins to fall inside. */
const SPAN = 6;

export function createMapLibreMock() {
  class LngLatBounds {
    constructor(
      readonly sw: { lng: number; lat: number },
      readonly ne: { lng: number; lat: number },
    ) {}
    getSouthWest() {
      return this.sw;
    }
    getNorthEast() {
      return this.ne;
    }
    contains([lng, lat]: [number, number]) {
      return lng >= this.sw.lng && lng <= this.ne.lng && lat >= this.sw.lat && lat <= this.ne.lat;
    }
  }

  class Map extends Evented {
    center: { lng: number; lat: number };
    zoom: number;
    style: unknown;
    readonly container: HTMLElement;
    readonly canvasContainer: HTMLElement;
    readonly controls: unknown[] = [];
    removed = false;

    constructor(options: {
      container: HTMLElement;
      center: [number, number];
      zoom: number;
      style?: unknown;
    }) {
      super();
      this.container = options.container;
      this.container.classList.add("maplibregl-map");
      this.canvasContainer = document.createElement("div");
      this.canvasContainer.className = "maplibregl-canvas-container";
      this.container.appendChild(this.canvasContainer);
      this.center = { lng: options.center[0], lat: options.center[1] };
      this.zoom = options.zoom;
      this.style = options.style;
    }

    getCanvasContainer() {
      return this.canvasContainer;
    }
    getContainer() {
      return this.container;
    }
    getZoom() {
      return this.zoom;
    }
    getCenter() {
      return this.center;
    }
    getBounds() {
      return new LngLatBounds(
        { lng: this.center.lng - SPAN, lat: this.center.lat - SPAN },
        { lng: this.center.lng + SPAN, lat: this.center.lat + SPAN },
      );
    }
    loaded() {
      return true;
    }
    setStyle(style: unknown) {
      this.style = style;
      return this;
    }
    addControl(control: unknown) {
      this.controls.push(control);
      const element = (control as { onAdd?: () => HTMLElement }).onAdd?.();
      if (element) this.canvasContainer.appendChild(element);
      return this;
    }
    /** Every move lands at once here, then says so, as the real map does. */
    private moveTo(options: { center?: [number, number]; zoom?: number }) {
      if (options.center) this.center = { lng: options.center[0], lat: options.center[1] };
      if (typeof options.zoom === "number") this.zoom = options.zoom;
      this.fire("move");
      this.fire("zoom");
      this.fire("moveend");
      return this;
    }
    flyTo(options: { center?: [number, number]; zoom?: number }) {
      return this.moveTo(options);
    }
    easeTo(options: { center?: [number, number]; zoom?: number }) {
      return this.moveTo(options);
    }
    jumpTo(options: { center?: [number, number]; zoom?: number }) {
      return this.moveTo(options);
    }
    fitBounds(bounds: [[number, number], [number, number]]) {
      return this.moveTo({
        center: [(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2],
      });
    }
    remove() {
      this.removed = true;
      this.canvasContainer.remove();
      this.container.classList.remove("maplibregl-map");
    }
  }

  class Marker extends Evented {
    readonly element: HTMLElement;
    lngLat = { lng: 0, lat: 0 };
    readonly draggable: boolean;

    constructor(options: { element?: HTMLElement; draggable?: boolean } = {}) {
      super();
      this.element = options.element ?? document.createElement("div");
      this.element.classList.add("maplibregl-marker");
      this.draggable = options.draggable ?? false;
    }

    setLngLat(at: [number, number]) {
      this.lngLat = { lng: at[0], lat: at[1] };
      return this;
    }
    getLngLat() {
      return this.lngLat;
    }
    getElement() {
      return this.element;
    }
    addTo(map: Map) {
      map.getCanvasContainer().appendChild(this.element);
      return this;
    }
    remove() {
      this.element.remove();
      return this;
    }
  }

  class Popup extends Evented {
    readonly element: HTMLElement;
    lngLat = { lng: 0, lat: 0 };

    constructor(options: { className?: string } = {}) {
      super();
      this.element = document.createElement("div");
      this.element.className = `maplibregl-popup ${options.className ?? ""}`.trim();
      const content = document.createElement("div");
      content.className = "maplibregl-popup-content";
      this.element.appendChild(content);
    }

    setLngLat(at: [number, number]) {
      this.lngLat = { lng: at[0], lat: at[1] };
      return this;
    }
    setDOMContent(node: Node) {
      const content = this.element.querySelector(".maplibregl-popup-content")!;
      content.replaceChildren(node);
      return this;
    }
    isOpen() {
      return this.element.isConnected;
    }
    addTo(map: Map) {
      map.getContainer().appendChild(this.element);
      this.fire("open");
      return this;
    }
    remove() {
      if (!this.element.isConnected) return this;
      this.element.remove();
      this.fire("close");
      return this;
    }
  }

  class NavigationControl {
    onAdd() {
      const element = document.createElement("div");
      element.className = "maplibregl-ctrl maplibregl-ctrl-group";
      return element;
    }
  }

  class AttributionControl {
    onAdd() {
      const element = document.createElement("div");
      element.className = "maplibregl-ctrl maplibregl-ctrl-attrib";
      return element;
    }
  }

  /** Where the app told MapLibre to find its worker; read back in tests. */
  const workerUrl = { current: "" };
  const setWorkerUrl = (url: string) => {
    workerUrl.current = url;
  };

  const gl = {
    Map,
    Marker,
    Popup,
    NavigationControl,
    AttributionControl,
    LngLatBounds,
    setWorkerUrl,
    workerUrl,
  };
  // The app reads the namespace or its default export, whichever the bundler gives
  return { ...gl, default: gl };
}
