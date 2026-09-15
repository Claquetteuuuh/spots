import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockListAllObjects = vi.fn();
const mockDeleteFiles = vi.fn();
vi.mock("@/lib/storage", () => ({
  listAllObjects: (...args: unknown[]) => mockListAllObjects(...args),
  deleteFiles: (...args: unknown[]) => mockDeleteFiles(...args),
  keyFromUrl: (url: string | null) => (url ? url.replace("https://cdn.example.com/", "") : null),
}));

const rows = {
  spot: [] as { photoKey: string }[],
  spotImage: [] as { photoKey: string }[],
  spotPhotoImage: [] as { photoKey: string }[],
  user: [] as { avatarUrl: string | null }[],
};
vi.mock("@/lib/db", () => ({
  prisma: {
    spot: { findMany: async () => rows.spot },
    spotImage: { findMany: async () => rows.spotImage },
    spotPhotoImage: { findMany: async () => rows.spotPhotoImage },
    user: { findMany: async () => rows.user },
  },
}));

import { GET } from "../cron/storage-cleanup/route";
import { sweepOrphans } from "@/lib/storage-sweep";

const HOUR = 60 * 60 * 1000;

/** An object in the bucket, `ageHours` old. */
const object = (key: string, ageHours: number, size = 1000) => ({
  key,
  size,
  lastModified: new Date(Date.now() - ageHours * HOUR),
});

function cronRequest(token?: string) {
  return new NextRequest("http://localhost/api/cron/storage-cleanup", {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  rows.spot = [];
  rows.spotImage = [];
  rows.spotPhotoImage = [];
  rows.user = [];
  mockDeleteFiles.mockResolvedValue(undefined);
  process.env.CRON_SECRET = "s3cret";
});

describe("the orphan sweep", () => {
  it("deletes what no row points at, and nothing that one does", async () => {
    rows.spot = [{ photoKey: "spots/u1/cover.webp" }];
    rows.spotImage = [{ photoKey: "spots/u1/second.webp" }];
    rows.spotPhotoImage = [{ photoKey: "spot-photos/s1/u2/post.webp" }];
    rows.user = [{ avatarUrl: "https://cdn.example.com/avatars/u1.webp" }];
    mockListAllObjects.mockResolvedValue([
      object("spots/u1/cover.webp", 48),
      object("spots/u1/second.webp", 48),
      object("spot-photos/s1/u2/post.webp", 48),
      object("avatars/u1.webp", 48),
      object("spots/u1/abandoned.webp", 48), // uploaded, never saved
    ]);

    const summary = await sweepOrphans({ apply: true });

    expect(mockDeleteFiles).toHaveBeenCalledWith(["spots/u1/abandoned.webp"]);
    expect(summary).toMatchObject({ objects: 5, referenced: 4, orphans: 1, deleted: 1 });
  });

  it("leaves alone what may still be on its way to a row", async () => {
    // The photo goes up seconds before the spot that references it exists
    mockListAllObjects.mockResolvedValue([object("spots/u1/in-flight.webp", 0.5)]);

    const summary = await sweepOrphans({ apply: true });

    expect(mockDeleteFiles).not.toHaveBeenCalled();
    expect(summary).toMatchObject({ orphans: 0, skipped: 1, deleted: 0 });
  });

  it("says what it would delete without deleting it", async () => {
    mockListAllObjects.mockResolvedValue([object("spots/u1/orphan.webp", 48, 2048)]);

    const summary = await sweepOrphans();

    expect(mockDeleteFiles).not.toHaveBeenCalled();
    expect(summary).toMatchObject({ orphans: 1, deleted: 0, bytesFreed: 2048 });
    expect(summary.keys).toEqual(["spots/u1/orphan.webp"]);
  });
});

describe("GET /api/cron/storage-cleanup", () => {
  it("sweeps when the scheduler calls with the secret", async () => {
    mockListAllObjects.mockResolvedValue([object("spots/u1/orphan.webp", 48)]);

    const res = await GET(cronRequest("s3cret"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toMatchObject({ deleted: 1 });
    expect(mockDeleteFiles).toHaveBeenCalled();
  });

  it("refuses anyone else — this endpoint deletes photographs", async () => {
    mockListAllObjects.mockResolvedValue([object("spots/u1/orphan.webp", 48)]);

    expect((await GET(cronRequest())).status).toBe(401);
    expect((await GET(cronRequest("wrong"))).status).toBe(401);
    expect(mockDeleteFiles).not.toHaveBeenCalled();
  });

  it("refuses everyone when no secret is configured, rather than running openly", async () => {
    delete process.env.CRON_SECRET;

    expect((await GET(cronRequest("s3cret"))).status).toBe(401);
    expect(mockListAllObjects).not.toHaveBeenCalled();
  });
});
