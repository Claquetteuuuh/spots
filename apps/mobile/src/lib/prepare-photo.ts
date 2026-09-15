import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { File } from "expo-file-system";
import { UPLOAD_PRESETS, type UploadPreset } from "@trs/shared/constants";

/**
 * Shrinking a photo before it leaves the phone. The server re-encodes
 * whatever arrives, so this is not about what ends up in the bucket: it
 * is about what crosses a mobile connection. A 12 MP photo is eight
 * megabytes, and nothing on screen is served by it.
 */
export { UPLOAD_PRESETS };

/** A photo on its way up: where it is, and what to call it. */
export interface PreparedPhoto {
  uri: string;
  fileName?: string;
}

/**
 * Draw a photo at the preset's size and re-encode it. A photo the phone
 * cannot re-encode goes up as it is rather than not at all.
 */
export async function preparePhoto(
  uri: string,
  fileName: string,
  preset: UploadPreset = UPLOAD_PRESETS.community,
): Promise<PreparedPhoto> {
  try {
    const ctx = ImageManipulator.manipulate(uri);
    ctx.resize({ width: preset.maxEdge });
    const rendered = await ctx.renderAsync();
    const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: preset.quality });
    return { uri: saved.uri, fileName };
  } catch {
    return { uri, fileName };
  }
}

/** What a prepared photo weighs, as the file system has it. */
export function weighPhoto(photo: PreparedPhoto): number {
  try {
    return new File(photo.uri).size ?? 0;
  } catch {
    return 0;
  }
}
