/**
 * MapLibre draws vector tiles in a web worker, which it starts from a URL
 * of its own dist folder. A bundler that rewrites module URLs (Turbopack
 * does) sends it looking for a file that isn't there: the worker starts,
 * imports nothing, answers nothing, and every tile stays "loading" for
 * ever — a blank map, with no error anywhere.
 *
 * So we serve the worker ourselves. This copies it, and the code it
 * imports, into `public/map-worker/` before dev and build; `map-engine.ts`
 * points MapLibre at it. The copies are generated, never committed.
 */
import { createRequire } from "node:module";
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const FILES = ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"];

const require = createRequire(import.meta.url);
const dist = dirname(require.resolve("maplibre-gl/dist/maplibre-gl-worker.mjs"));
const out = join(dirname(dirname(fileURLToPath(import.meta.url))), "public", "map-worker");

mkdirSync(out, { recursive: true });
for (const file of FILES) copyFileSync(join(dist, file), join(out, file));
