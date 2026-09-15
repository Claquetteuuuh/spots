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
import { prisma } from "../src/lib/db";
import { MIN_ORPHAN_AGE_HOURS, sweepOrphans } from "../src/lib/storage-sweep";

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

async function main() {
  const apply = flag("apply") === "true";
  const minAgeHours = Number(flag("min-age-hours") ?? MIN_ORPHAN_AGE_HOURS);

  console.log("Listing bucket…");
  const summary = await sweepOrphans({ apply, minAgeHours });

  console.log(
    `${summary.objects} object(s) — ${summary.referenced} key(s) referenced by the database`,
  );
  if (summary.skipped > 0) {
    console.log(
      `Skipping ${summary.skipped} unreferenced object(s) newer than ${minAgeHours}h (may still be in flight)`,
    );
  }

  if (summary.orphans === 0) {
    console.log("Nothing to clean up.");
    return;
  }

  console.log(`\n${summary.orphans} orphaned object(s), ${formatBytes(summary.bytesFreed)} reclaimable:`);
  for (const key of summary.keys) console.log(`  ${key}`);
  if (summary.orphans > summary.keys.length) {
    console.log(`  …and ${summary.orphans - summary.keys.length} more`);
  }

  if (!apply) {
    console.log("\nDry run — re-run with --apply to delete.");
    return;
  }

  console.log(`\nDeleted ${summary.deleted} object(s), freed ${formatBytes(summary.bytesFreed)}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
