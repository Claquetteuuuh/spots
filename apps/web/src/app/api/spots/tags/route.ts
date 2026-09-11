import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  successResponse,
  withAuth,
} from "@/lib/api-utils";

export const GET = withAuth(async (request: NextRequest) => {
  const q = request.nextUrl.searchParams.get("q") ?? "";

  if (!q.trim()) {
    return successResponse<string[]>([]);
  }

  const pattern = `%${q}%`;

  const rows = await prisma.$queryRaw<{ tag: string }[]>`
    SELECT DISTINCT t AS tag
    FROM "Spot", unnest(tags) AS t
    WHERE LOWER(t) LIKE LOWER(${pattern})
    ORDER BY t
    LIMIT 10
  `;

  return successResponse(rows.map((r) => r.tag));
});
