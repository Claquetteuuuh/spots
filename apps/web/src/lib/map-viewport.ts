/** Where the map was left: its centre and zoom. */
export interface RememberedView {
  lat: number;
  lng: number;
  zoom: number;
}

const KEY = "trs.map.view";

// Kept for the tab's lifetime, so coming back from a spot lands where the
// photographer was — never across tabs, and never from an earlier day.
// Where sessionStorage is missing or refused, memory alone does the job.
let memory: RememberedView | null = null;

function storage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

export function rememberMapView(view: RememberedView): void {
  memory = view;
  try {
    storage()?.setItem(KEY, JSON.stringify(view));
  } catch {
    // Quota or private mode: memory has it
  }
}

export function recallMapView(): RememberedView | null {
  try {
    const raw = storage()?.getItem(KEY);
    if (raw) {
      const view = JSON.parse(raw) as Partial<RememberedView>;
      if (
        typeof view.lat === "number" &&
        typeof view.lng === "number" &&
        typeof view.zoom === "number"
      ) {
        return { lat: view.lat, lng: view.lng, zoom: view.zoom };
      }
    }
  } catch {
    // Unreadable: fall back to memory
  }
  return memory;
}

export function forgetMapView(): void {
  memory = null;
  try {
    storage()?.removeItem(KEY);
  } catch {
    // Nothing to forget
  }
}
