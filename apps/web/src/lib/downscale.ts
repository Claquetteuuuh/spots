/**
 * Shrinking a photo before it leaves the browser. The server re-encodes
 * everything it stores, so this is not about what ends up in the bucket —
 * it is about not pushing a 12 MP original across a phone's connection
 * first. The app does the same thing natively.
 */

/** The longest edge the server would keep anyway (`lib/image.ts`). */
export const UPLOAD_MAX_EDGE = 2560;
export const UPLOAD_QUALITY = 0.85;

/**
 * A smaller copy of a chosen photo, or the photo itself when shrinking it
 * would not help — it is already small, the browser cannot decode it
 * (HEIC, mostly), or the result came out no lighter.
 */
export async function downscaleForUpload(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const longest = Math.max(bitmap.width, bitmap.height);
    const scale = Math.min(1, UPLOAD_MAX_EDGE / longest);

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", UPLOAD_QUALITY),
    );
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, { type: "image/webp" });
  } catch {
    // A photo the browser cannot decode still goes up as it is
    return file;
  }
}
