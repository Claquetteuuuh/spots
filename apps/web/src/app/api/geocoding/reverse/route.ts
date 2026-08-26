import { NextResponse, type NextRequest } from "next/server";
import { reverseGeocodeSchema } from "@trs/shared/validation";
import { handleApiError, successResponse, validateBody } from "@/lib/api-utils";
import { reverseGeocode } from "@/lib/geocode";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const latRaw = searchParams.get("lat") ?? searchParams.get("latitude");
    const lonRaw = searchParams.get("lon") ?? searchParams.get("longitude");

    const { latitude, longitude } = validateBody(reverseGeocodeSchema, {
      latitude: latRaw !== null ? Number(latRaw) : Number.NaN,
      longitude: lonRaw !== null ? Number(lonRaw) : Number.NaN,
    });

    const result = await reverseGeocode(latitude, longitude);

    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
