/**
 * Reverse geocoding via the Nominatim (OpenStreetMap) public API.
 *
 * Nominatim's usage policy (https://operations.osmfoundation.org/policies/nominatim/)
 * requires a descriptive `User-Agent` identifying the application, and asks
 * that clients keep request volume reasonable (max 1 request/second).
 */

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/reverse";
const NOMINATIM_USER_AGENT =
  "TheRightSpot/1.0 (+https://github.com/the-right-spot; contact: support@therightspot.app)";

export interface ReverseGeocodeResult {
  address: string | null;
  city: string | null;
  country: string | null;
}

interface NominatimAddress {
  road?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state?: string;
  country?: string;
}

interface NominatimReverseResponse {
  display_name?: string;
  address?: NominatimAddress;
  error?: string;
}

/**
 * Look up a human-readable address for a pair of coordinates using
 * Nominatim's reverse geocoding endpoint.
 *
 * Returns null fields (rather than throwing) when Nominatim has no address
 * data for the given coordinates. Throws only on network/HTTP failure.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult> {
  const url = new URL(NOMINATIM_BASE_URL);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("zoom", "18");
  url.searchParams.set("addressdetails", "1");

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      headers: {
        "User-Agent": NOMINATIM_USER_AGENT,
        Accept: "application/json",
      },
    });
  } catch (cause) {
    throw new Error("Failed to reach the geocoding service", { cause });
  }

  if (!response.ok) {
    throw new Error(
      `Geocoding service responded with status ${response.status}`
    );
  }

  const payload = (await response.json()) as NominatimReverseResponse;

  if (payload.error || !payload.address) {
    return { address: null, city: null, country: null };
  }

  const city =
    payload.address.city ??
    payload.address.town ??
    payload.address.village ??
    payload.address.municipality ??
    payload.address.county ??
    payload.address.state ??
    null;

  return {
    address: payload.display_name ?? null,
    city,
    country: payload.address.country ?? null,
  };
}
