import {
  ACCEPTED_IMAGE_TYPES,
  MAX_PHOTO_SIZE_BYTES,
  MAX_POST_BYTES,
  UPLOAD_PRESETS,
  shrinkPasses,
  type UploadPreset,
} from "@trs/shared/constants";
import { t } from "@/lib/i18n";

/**
 * Shrinking photos before they leave the browser. The server re-encodes
 * everything it stores, so this is not about what ends up in the bucket:
 * it is about what crosses the network. A serverless request body is
 * capped, and the platform answers a bare 413 when a post is over it —
 * so a post is shrunk here until it fits.
 */

/** How long a browser gets to draw a photo it decodes the slow way. */
const DECODE_TIMEOUT_MS = 8000;

/**
 * Extensions a browser sometimes hands over with no MIME type at all —
 * an iPhone's HEIC, most often, which is then refused for being of "no
 * type" even though it is exactly the photo the photographer meant.
 */
const PHOTO_EXTENSIONS = /\.(jpe?g|png|webp|heic|heif|avif)$/i;

/**
 * Whether a chosen file is a photo this app can take. The weight checked
 * is the one on disk: what leaves the browser is drawn down first, so
 * the ceiling is only about what the device is asked to decode.
 */
export function isUsablePhoto(file: File): boolean {
  const known = ACCEPTED_IMAGE_TYPES.includes(file.type) || file.type.startsWith("image/");
  const unnamed = file.type === "" && PHOTO_EXTENSIONS.test(file.name);
  return (known || unnamed) && file.size <= MAX_PHOTO_SIZE_BYTES;
}

/**
 * Decode a chosen file. `createImageBitmap` is the fast path and the one
 * that fails on HEIC — the format an iPhone hands over — where the OS
 * can still draw it through an `<img>`. Without this fallback a HEIC
 * photo travelled at full size, and four of them met a 413.
 */
async function decode(file: File): Promise<CanvasImageSource & { width: number; height: number }> {
  try {
    return await createImageBitmap(file);
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.decoding = "async";
      await new Promise<void>((resolve, reject) => {
        // A decode that neither loads nor errors would leave the post
        // waiting for ever: the photo goes up as it is instead.
        const timer = setTimeout(() => reject(new Error("undecodable")), DECODE_TIMEOUT_MS);
        image.onload = () => {
          clearTimeout(timer);
          resolve();
        };
        image.onerror = () => {
          clearTimeout(timer);
          reject(new Error("undecodable"));
        };
        image.src = url;
      });
      return image;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

/** Draw the photo at `maxEdge` and re-encode it; null when nothing is gained. */
async function reencode(file: File, maxEdge: number, quality: number): Promise<File | null> {
  const source = await decode(file);
  const longest = Math.max(source.width, source.height);
  if (!longest) return null;
  const scale = Math.min(1, maxEdge / longest);

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(source.width * scale);
  canvas.height = Math.round(source.height * scale);
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  (source as ImageBitmap).close?.();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", quality),
  );
  if (!blob) return null;

  return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, { type: "image/webp" });
}

/**
 * A smaller copy of a chosen photo, or the photo itself when shrinking it
 * would not help — it is already small, or the result came out no
 * lighter than what it came from.
 */
export async function downscaleForUpload(
  file: File,
  { maxEdge, quality }: UploadPreset = UPLOAD_PRESETS.community,
): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const smaller = await reencode(file, maxEdge, quality);
    return smaller && smaller.size < file.size ? smaller : file;
  } catch {
    // A photo the browser cannot decode at all still goes up as it is
    return file;
  }
}

/** What a set of files weighs together. */
const weigh = (files: File[]) => files.reduce((total, file) => total + file.size, 0);

/**
 * Every photo of a post, shrunk enough for the post to fit on the wire.
 * Each pass draws them smaller; if even the last one is too heavy, the
 * photographer is told rather than left with a 413.
 */
export async function prepareForUpload(
  files: File[],
  preset: UploadPreset = UPLOAD_PRESETS.community,
): Promise<File[]> {
  let prepared = files;

  for (const pass of shrinkPasses(preset)) {
    prepared = await Promise.all(files.map((file) => downscaleForUpload(file, pass)));
    if (weigh(prepared) <= MAX_POST_BYTES) return prepared;
  }

  throw new Error(t("spotPhotos.tooHeavy"));
}
