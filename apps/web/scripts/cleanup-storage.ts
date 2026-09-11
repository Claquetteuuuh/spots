/**
 * Storage orphan sweep.
 *
 * Lists every object in the bucket and deletes the ones no database row
 * references any more: photos of spots deleted before cleanup was
 * complete, drafts abandoned mid-creation, avatars from before DiceBear.
 *
 * Objects younger than `--min-age-hours` (default 24) are left alone —
 * a photo is uploaded a few seconds before the spot that references it
 * exists, and this must never race that window.
 *
 * Dry-run by default: prints what it would delete. Pass `--apply` to
 * actually delete.
 *
 *   pnpm --filter @trs/web storage:cleanup
 *   pnpm --filter @trs/web storage:cleanup --apply
 *   pnpm --filter @trs/web storage:cleanup --apply --min-age-hours=1
 */
import { PrismaClient } from "../src/generated/prisma";
import { deleteFiles, keyFromUrl, listAllObjects } from "../src/lib/storage";

// Node ≥ 20.12 — no dotenv dependency needed. Missing file = env is set elsewhere.
try {
  process.loadEnvFile(".env");
} catch {
  // Nothing to load
}

function flag(name: string): string | undefined {
  const arg = process.argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!arg) return undefined;
  const [, value] = arg.split("=");
  return value ?? "true";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function referencedKeys(prisma: PrismaClient): Promise<Set<string>> {
  const [spots, images, communityPhotos, users] = await Promise.all([
    prisma.spot.findMany({ select: { photoKey: true } }),
    prisma.spotImage.findMany({ select: { photoKey: true } }),
    prisma.spotPhoto.findMany({ select: { photoKey: true } }),
    prisma.user.findMany({
      where: { avatarUrl: { not: null } },
      select: { avatarUrl: true },
    }),
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

async function main() {
  const apply = flag("apply") === "true";
  const minAgeHours = Number(flag("min-age-hours") ?? 24);
  const cutoff = Date.now() - minAgeHours * 60 * 60 * 1000;

  const prisma = new PrismaClient();
  try {
    console.log(`Listing bucket…`);
    const [objects, referenced] = await Promise.all([
      listAllObjects(),
      referencedKeys(prisma),
    ]);

    const totalBytes = objects.reduce((sum, o) => sum + o.size, 0);
    console.log(
      `${objects.length} object(s), ${formatBytes(totalBytes)} — ${referenced.size} key(s) referenced by the database`,
    );

    const orphans = objects.filter((o) => !referenced.has(o.key));
    const tooRecent = orphans.filter((o) => o.lastModified.getTime() > cutoff);
    const deletable = orphans.filter((o) => o.lastModified.getTime() <= cutoff);
    const reclaimable = deletable.reduce((sum, o) => sum + o.size, 0);

    if (tooRecent.length > 0) {
      console.log(
        `Skipping ${tooRecent.length} unreferenced object(s) newer than ${minAgeHours}h (may still be in flight)`,
      );
    }

    if (deletable.length === 0) {
      console.log("Nothing to clean up.");
      return;
    }

    console.log(
      `\n${deletable.length} orphaned object(s), ${formatBytes(reclaimable)} reclaimable:`,
    );
    for (const o of deletable) {
      console.log(`  ${o.key}  ${formatBytes(o.size)}  ${o.lastModified.toISOString()}`);
    }

    if (!apply) {
      console.log(`\nDry run — re-run with --apply to delete.`);
      return;
    }

    await deleteFiles(deletable.map((o) => o.key));
    console.log(`\nDeleted ${deletable.length} object(s), freed ${formatBytes(reclaimable)}.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
