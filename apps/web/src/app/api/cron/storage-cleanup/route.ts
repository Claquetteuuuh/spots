import { NextResponse, type NextRequest } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { MIN_ORPHAN_AGE_HOURS, sweepOrphans } from "@/lib/storage-sweep";

/**
 * GET /api/cron/storage-cleanup — delete the bucket's orphans.
 *
 * Runs on a schedule (see `vercel.json`). Vercel sends the cron secret
 * as a bearer token; without one configured the route refuses everyone,
 * because an open endpoint that deletes stored photos is worse than a
 * bucket with something left in it.
 */
export const dynamic = "force-dynamic";
/** Listing a whole bucket and deleting in batches takes more than a moment. */
export const maxDuration = 300;

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Trimmed on both sides: a secret pasted into a dashboard arrives with
  // a trailing newline more often than anyone would like.
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    // Worth saying out loud: it is the difference between "the secret is
    // wrong" and "this deployment was built before the secret existed",
    // and the two are fixed in completely different places.
    return NextResponse.json(
      { error: "CRON_SECRET is not set on this deployment. Add it, then redeploy." },
      { status: 401 },
    );
  }

  if (request.headers.get("authorization")?.trim() !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await sweepOrphans({ apply: true, minAgeHours: MIN_ORPHAN_AGE_HOURS });
    console.log(
      `Storage sweep: ${summary.deleted} orphan(s) deleted, ${summary.bytesFreed} byte(s) freed, ${summary.skipped} too recent to touch`,
    );
    return NextResponse.json({ data: summary });
  } catch (error) {
    return handleApiError(error);
  }
}
