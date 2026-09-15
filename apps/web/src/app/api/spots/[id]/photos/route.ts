import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { parseMentions } from "@trs/shared/mentions";
import { prisma } from "@/lib/db";
import {
  ApiError,
  handleApiError,
  successResponse,
  withAuth,
} from "@/lib/api-utils";
import { deleteFiles, uploadFile } from "@/lib/storage";
import { readPhotoUploads } from "@/lib/upload";

const PHOTO_AUTHOR_SELECT = {
  id: true,
  username: true,
  name: true,
  avatarUrl: true,
} as const;

/** A post, as both apps read it: its photos in order, the people it names. */
const POST_INCLUDE = {
  user: { select: PHOTO_AUTHOR_SELECT },
  images: {
    orderBy: { position: "asc" },
    select: { id: true, photoUrl: true },
  },
  mentions: {
    select: { user: { select: { id: true, username: true } } },
  },
} as const;

const MAX_CAPTION = 500;

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/spots/:id/photos — list community posts for a spot (public).
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const { searchParams } = request.nextUrl;
    const cursor = searchParams.get("cursor");
    const limit = Math.min(Number(searchParams.get("limit") ?? 20), 50);

    const photos = await prisma.spotPhoto.findMany({
      where: { spotId: id },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: POST_INCLUDE,
    });

    const hasMore = photos.length > limit;
    const items = hasMore ? photos.slice(0, limit) : photos;

    return NextResponse.json({
      data: {
        items: items.map(serializePost),
        nextCursor: hasMore ? items[items.length - 1].id : null,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/spots/:id/photos — post photos under a spot (auth required).
 *
 * One post, one to `MAX_POST_PHOTOS` photos, an optional caption. Anyone
 * named in the caption with an `@` is looked up and recorded, so the apps
 * can link the name to the account it meant.
 */
export const POST = withAuth<RouteParams>(
  async (request, authUser, { params }) => {
    const { id } = await params;

    const spot = await prisma.spot.findUnique({ where: { id }, select: { id: true } });
    if (!spot) throw new ApiError("Spot not found", 404);

    const { images, fields } = await readPhotoUploads(request, "photo");
    const raw = fields.get("caption");
    const caption = typeof raw === "string" && raw.trim() ? raw.trim().slice(0, MAX_CAPTION) : null;
    const mentioned = await findMentioned(caption, authUser.userId);

    const stored = await Promise.all(
      images.map(async (image, position) => {
        const photoKey = `spot-photos/${id}/${authUser.userId}/${randomUUID()}.${image.extension}`;
        const photoUrl = await uploadFile(photoKey, image.buffer, image.contentType);
        return { photoUrl, photoKey, position };
      }),
    );

    try {
      const post = await prisma.spotPhoto.create({
        data: {
          spotId: id,
          userId: authUser.userId,
          caption,
          images: { create: stored },
          mentions: { create: mentioned.map((userId) => ({ userId })) },
        },
        include: POST_INCLUDE,
      });

      return successResponse(serializePost(post), 201);
    } catch (error) {
      // The photos reached storage but the post never existed: take them
      // back out rather than leave them for the nightly sweep.
      try {
        await deleteFiles(stored.map((image) => image.photoKey));
      } catch (cleanupError) {
        console.error("Failed to discard photos of a post that was not created:", cleanupError);
      }
      throw error;
    }
  },
);

/** The accounts a caption names — the author's own handle aside. */
async function findMentioned(caption: string | null, authorId: string): Promise<string[]> {
  const handles = parseMentions(caption);
  if (handles.length === 0) return [];

  const users = await prisma.user.findMany({
    where: { username: { in: handles, mode: "insensitive" } },
    select: { id: true },
  });
  return users.map((u) => u.id).filter((userId) => userId !== authorId);
}

type PostRow = {
  mentions: { user: { id: string; username: string } }[];
};

/** Flatten the mention rows: the apps only need who was named. */
function serializePost<T extends PostRow>(post: T) {
  return { ...post, mentions: post.mentions.map((m) => m.user) };
}
