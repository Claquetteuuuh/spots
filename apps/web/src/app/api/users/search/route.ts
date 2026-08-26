import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@trs/db";
import { userSearchSchema } from "@trs/shared/validation";
import { handleApiError, successResponse, validateBody } from "@/lib/api-utils";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const { q, limit } = validateBody(userSearchSchema, searchParams);

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: q, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        username: true,
        name: true,
        avatarUrl: true,
        bio: true,
      },
      orderBy: { username: "asc" },
      take: limit,
    });

    return successResponse(users);
  } catch (error) {
    return handleApiError(error);
  }
}
