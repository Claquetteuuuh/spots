import { NextResponse, type NextRequest } from "next/server";
import { ApiError, handleApiError, successResponse } from "@/lib/api-utils";
import { forwardGeocode } from "@/lib/geocode";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const q = request.nextUrl.searchParams.get("q");

    if (!q || q.trim().length < 2) {
      throw new ApiError("Query must be at least 2 characters", 400);
    }

    const results = await forwardGeocode(q.trim());

    return successResponse(results);
  } catch (error) {
    return handleApiError(error);
  }
}
