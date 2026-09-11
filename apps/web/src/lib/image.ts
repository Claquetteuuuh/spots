import sharp from "sharp";
import { ApiError } from "./api-utils";

/**
 * Every photo that reaches object storage goes through here first.
 *
 * The goal is the smallest file that still looks like a photograph on a
 * phone or a laptop screen — not an archival master. So:
 *
 * - the longest edge is capped at `PHOTO_MAX_EDGE` (a 4:3 photo lands at
 *   ~5 MP; a 33 MP phone capture is downscaled, a 2 MP one is left alone)
 * - everything is re-encoded as WebP at `PHOTO_QUALITY` — roughly 25–35%
 *   smaller than a JPEG of the same visual quality, with alpha support
 *   for PNG sources
 * - EXIF orientation is applied to the pixels, then all metadata (EXIF,
 *   GPS, XMP, embedded thumbnails) is dropped. That is both bytes saved
 *   and a privacy win: a spot's coordinates are the ones the user typed,
 *   not the ones their camera recorded.
 * - embedded colour profiles are honoured, then the output is plain sRGB
 *   so it renders identically everywhere
 */
export const PHOTO_MAX_EDGE = 2560;
export const PHOTO_QUALITY = 80;
/** Encoder effort, 0 (fastest) to 6 (smallest). 4 is a good serverless compromise. */
const WEBP_EFFORT = 4;

export const PHOTO_OUTPUT_CONTENT_TYPE = "image/webp";
export const PHOTO_OUTPUT_EXTENSION = "webp";

const HEIC_TYPES = new Set(["image/heic", "image/heif"]);

export interface CompressedImage {
  buffer: Buffer;
  contentType: typeof PHOTO_OUTPUT_CONTENT_TYPE;
  extension: typeof PHOTO_OUTPUT_EXTENSION;
  width: number;
  height: number;
  inputBytes: number;
  outputBytes: number;
}

/**
 * libvips (and therefore sharp) ships without an HEVC decoder for patent
 * reasons, so iPhone HEIC files are decoded to JPEG in JavaScript first.
 * The module is loaded lazily: it is ~2 MB of WASM that the common
 * JPEG/PNG/WebP path never needs.
 */
async function decodeHeic(input: Buffer): Promise<Buffer> {
  const { default: convert } = await import("heic-convert");
  // Quality 1 = lossless-ish intermediate; the real compression happens
  // in the WebP step below, we don't want to compound two lossy passes.
  const jpeg = await convert({ buffer: input, format: "JPEG", quality: 1 });
  return Buffer.from(jpeg);
}

/**
 * Decode, orient, downscale and re-encode an uploaded image.
 *
 * Throws an `ApiError` (400) for anything that is not a decodable image —
 * a truncated file, a PDF with a `.jpg` name, an unsupported HEIC variant.
 */
export async function compressImage(
  input: Buffer,
  contentType: string,
): Promise<CompressedImage> {
  let source = input;

  if (HEIC_TYPES.has(contentType)) {
    try {
      source = await decodeHeic(input);
    } catch (error) {
      console.error("HEIC decode failed:", error);
      throw new ApiError(
        "Could not read this HEIC file. Try exporting it as JPEG first.",
        400,
      );
    }
  }

  try {
    const { data, info } = await sharp(source, { failOn: "error" })
      // No argument = use the EXIF orientation tag, then drop it.
      .rotate()
      .resize({
        width: PHOTO_MAX_EDGE,
        height: PHOTO_MAX_EDGE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: PHOTO_QUALITY, effort: WEBP_EFFORT })
      // sharp strips all metadata unless asked to keep it — which is
      // exactly what we want. Stated explicitly so nobody "fixes" it.
      .toBuffer({ resolveWithObject: true });

    return {
      buffer: data,
      contentType: PHOTO_OUTPUT_CONTENT_TYPE,
      extension: PHOTO_OUTPUT_EXTENSION,
      width: info.width,
      height: info.height,
      inputBytes: input.byteLength,
      outputBytes: data.byteLength,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error("Image processing failed:", error);
    throw new ApiError("Could not process this image. Is it a valid photo?", 400);
  }
}
