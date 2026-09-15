import { prisma } from "@/lib/db";
import { deleteFiles, keyFromUrl, listAllObjects } from "@/lib/storage";

/**
 * The orphan sweep: every object in the bucket that no database row
 * points at any more.
 *
 * They come from every path where a file reaches storage before the row
 * that owns it — a spot abandoned between the upload and the save, a tab
 * closed mid-flight, a request that failed after the photo was already
 * up. The apps clean up after themselves where they can; this catches
 * what no client ever could, because nothing was left running to do it.
 */

/** Below this, an object may simply be on its way to a row that does not exist yet. */
export const MIN_ORPHAN_AGE_HOURS = 24;

export interface SweepSummary {
  /** Everything in the bucket. */
  objects: number;
  /** Keys the database still points at. */
  referenced: number;
  /** Unreferenced, but too young to touch. */
  skipped: number;
  /** Unreferenced and old enough to delete. */
  orphans: number;
  deleted: number;
  bytesFreed: number;
  /** What was deleted, or what would be — capped, for a readable answer. */
  keys: string[];
}

const SAMPLE_KEYS = 50;

/** Every key the database still points at, from every table that holds one. */
export async function referencedKeys(): Promise<Set<string>> {
  const [spots, images, communityPhotos, users] = await Promise.all([
    prisma.spot.findMany({ select: { photoKey: true } }),
    prisma.spotImage.findMany({ select: { photoKey: true } }),
    prisma.spotPhotoImage.findMany({ select: { photoKey: true } }),
    prisma.user.findMany({ where: { avatarUrl: { not: null } }, select: { avatarUrl: true } }),
  ]);

  const keys = new Set<string>();
  for (const row of [...spots, ...images, ...communityPhotos]) keys.add(row.photoKey);
  // Legacy uploaded avatars are still in use until the user picks a DiceBear one.
  for (const user of users) {
    const key = keyFromUrl(user.avatarUrl);
    if (key) keys.add(key);
  }
  return keys;
}

/**
 * Find the orphans and, when asked to, delete them. Anything younger
 * than `minAgeHours` is left alone: a photo is uploaded seconds before
 * the spot that references it exists, and this must never race that.
 */
export async function sweepOrphans({
  apply = false,
  minAgeHours = MIN_ORPHAN_AGE_HOURS,
}: { apply?: boolean; minAgeHours?: number } = {}): Promise<SweepSummary> {
  const cutoff = Date.now() - minAgeHours * 60 * 60 * 1000;

  const [objects, referenced] = await Promise.all([listAllObjects(), referencedKeys()]);

  const unreferenced = objects.filter((object) => !referenced.has(object.key));
  const deletable = unreferenced.filter((object) => object.lastModified.getTime() <= cutoff);
  const bytesFreed = deletable.reduce((sum, object) => sum + object.size, 0);

  if (apply && deletable.length > 0) {
    await deleteFiles(deletable.map((object) => object.key));
  }

  return {
    objects: objects.length,
    referenced: referenced.size,
    skipped: unreferenced.length - deletable.length,
    orphans: deletable.length,
    deleted: apply ? deletable.length : 0,
    bytesFreed,
    keys: deletable.slice(0, SAMPLE_KEYS).map((object) => object.key),
  };
}
