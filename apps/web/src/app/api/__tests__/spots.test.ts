import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { NextRequest } from "next/server";

// Mock Prisma
const mockSpotFindMany = vi.fn();
const mockSpotFindUnique = vi.fn();
const mockSpotCreate = vi.fn();
const mockSpotUpdate = vi.fn();
const mockSpotDelete = vi.fn();
// Visibility checks: GET /api/spots resolves the viewer's accepted follows
// (follow.findMany) and GET /api/spots/[id] checks a single follow row
// (follow.findUnique) when the viewer is not the owner.
const mockFollowFindMany = vi.fn();
const mockFollowFindUnique = vi.fn();
const mockFollowCount = vi.fn();
vi.mock("@/lib/db", () => ({
  prisma: {
    spot: {
      findMany: (...args: unknown[]) => mockSpotFindMany(...args),
      findUnique: (...args: unknown[]) => mockSpotFindUnique(...args),
      create: (...args: unknown[]) => mockSpotCreate(...args),
      update: (...args: unknown[]) => mockSpotUpdate(...args),
      delete: (...args: unknown[]) => mockSpotDelete(...args),
    },
    follow: {
      findMany: (...args: unknown[]) => mockFollowFindMany(...args),
      findUnique: (...args: unknown[]) => mockFollowFindUnique(...args),
      count: (...args: unknown[]) => mockFollowCount(...args),
    },
  },
  Prisma: {
    PrismaClientKnownRequestError: class extends Error {},
  },
}));

/**
 * Clear call history and restore neutral defaults so a query a test did not
 * explicitly mock resolves to "nothing found" instead of `undefined` (or a
 * value leaked from a previous test — `vi.clearAllMocks()` alone keeps
 * implementations set via `mockResolvedValue`).
 */
function resetPrismaMocks() {
  vi.clearAllMocks();
  mockSpotFindMany.mockResolvedValue([]);
  mockSpotFindUnique.mockResolvedValue(null);
  mockFollowFindMany.mockResolvedValue([]);
  mockFollowFindUnique.mockResolvedValue(null);
  mockFollowCount.mockResolvedValue(0);
}

// Mock auth
const mockGetUserFromRequest = vi.fn();
vi.mock("@/lib/auth", () => ({
  signAccessToken: vi.fn().mockReturnValue("mock-access-token"),
  signRefreshToken: vi.fn().mockReturnValue("mock-refresh-token"),
  verifyAccessToken: vi.fn().mockReturnValue({
    userId: "user-1",
    email: "alice@example.com",
    username: "alice",
  }),
  getUserFromRequest: (...args: unknown[]) => mockGetUserFromRequest(...args),
  extractBearerToken: vi.fn().mockReturnValue("mock-token"),
}));

// Mock geocode
vi.mock("@/lib/geocode", () => ({
  reverseGeocode: vi.fn().mockResolvedValue({
    address: "123 Photo St",
    city: "Paris",
    country: "France",
  }),
}));

// Mock storage
vi.mock("@/lib/storage", () => ({
  deleteFile: vi.fn().mockResolvedValue(undefined),
}));

import { GET } from "../spots/route";
import { POST } from "../spots/route";
import {
  GET as GET_BY_ID,
  PATCH,
  DELETE,
} from "../spots/[id]/route";

/** The spot owner — spots are only visible to the owner and accepted followers. */
const OWNER = {
  userId: "user-1",
  email: "alice@example.com",
  username: "alice",
};

/** Another user, who can only see the owner's spots once they follow them. */
const OTHER_VIEWER = {
  userId: "user-2",
  email: "bob@example.com",
  username: "bob",
};

const SAMPLE_SPOT = {
  id: "spot-1",
  userId: OWNER.userId,
  latitude: 48.8566,
  longitude: 2.3522,
  address: "Paris, France",
  city: "Paris",
  country: "France",
  photoUrl: "https://cdn.example.com/photo.jpg",
  photoKey: "spots/user-1/photo.jpg",
  title: "Eiffel Tower",
  description: "A beautiful view",
  isFree: true,
  priceInfo: null,
  visibility: "FOLLOWERS",
  customComposition: null,
  colors: ["#D4A574"],
  compositions: ["SYMMETRY"],
  tags: ["sunset"],
  createdAt: new Date(),
  updatedAt: new Date(),
  user: { id: OWNER.userId, username: OWNER.username, name: "Alice", avatarUrl: null },
  images: [],
};

function makeGetRequest(params: Record<string, string> = {}) {
  const url = new URL("http://localhost/api/spots");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return new NextRequest(url.toString());
}

function makePostRequest(body: unknown) {
  return new NextRequest("http://localhost/api/spots", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer mock-token",
    },
    body: JSON.stringify(body),
  });
}

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
});

describe("GET /api/spots", () => {
  beforeEach(() => {
    resetPrismaMocks();
    // Spots are private to the owner + accepted followers, so the listing
    // is only populated for an authenticated viewer. View as the owner.
    mockGetUserFromRequest.mockResolvedValue(OWNER);
  });

  it("returns an empty page without querying the DB for unauthenticated viewers", async () => {
    mockGetUserFromRequest.mockResolvedValue(null);
    mockSpotFindMany.mockResolvedValue([SAMPLE_SPOT]);

    const res = await GET(makeGetRequest());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual({ items: [], nextCursor: null });
    expect(mockSpotFindMany).not.toHaveBeenCalled();
  });

  it("restricts results to the viewer and the users they follow", async () => {
    mockFollowFindMany.mockResolvedValue([{ followingId: "user-3" }]);

    await GET(makeGetRequest());

    expect(mockFollowFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { followerId: OWNER.userId, status: "ACCEPTED" },
      }),
    );
    const call = mockSpotFindMany.mock.calls[0][0];
    expect(call.where.userId).toEqual({ in: [OWNER.userId, "user-3"] });
  });

  it("returns an empty page when filtering by a user the viewer does not follow", async () => {
    mockSpotFindMany.mockResolvedValue([SAMPLE_SPOT]);

    const res = await GET(makeGetRequest({ userId: "user-3" }));
    const json = await res.json();

    expect(json.data).toEqual({ items: [], nextCursor: null });
    expect(mockSpotFindMany).not.toHaveBeenCalled();
  });

  it("returns paginated spots", async () => {
    mockSpotFindMany.mockResolvedValue([SAMPLE_SPOT]);

    const res = await GET(makeGetRequest());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.items).toHaveLength(1);
    expect(json.data.items[0].title).toBe("Eiffel Tower");
    expect(json.data.nextCursor).toBeNull();
  });

  it("filters by userId", async () => {
    mockSpotFindMany.mockResolvedValue([]);

    await GET(makeGetRequest({ userId: "user-1" }));

    const call = mockSpotFindMany.mock.calls[0][0];
    expect(call.where.userId).toBe("user-1");
  });

  it("applies bounding box filter when all params present", async () => {
    mockSpotFindMany.mockResolvedValue([]);

    await GET(
      makeGetRequest({
        swLat: "48.0",
        swLng: "2.0",
        neLat: "49.0",
        neLng: "3.0",
      }),
    );

    const call = mockSpotFindMany.mock.calls[0][0];
    expect(call.where.latitude).toEqual({ gte: 48, lte: 49 });
    expect(call.where.longitude).toEqual({ gte: 2, lte: 3 });
  });

  it("sets nextCursor when there are more results", async () => {
    // Default limit is 20, returning 21 means hasMore
    const spots = Array.from({ length: 21 }, (_, i) => ({
      ...SAMPLE_SPOT,
      id: `spot-${i}`,
    }));
    mockSpotFindMany.mockResolvedValue(spots);

    const res = await GET(makeGetRequest());
    const json = await res.json();

    expect(json.data.items).toHaveLength(20);
    expect(json.data.nextCursor).toBe("spot-19");
  });
});

describe("POST /api/spots", () => {
  beforeEach(() => {
    resetPrismaMocks();
    mockGetUserFromRequest.mockResolvedValue(OWNER);
  });

  it("creates a spot and returns 201", async () => {
    mockSpotCreate.mockResolvedValue(SAMPLE_SPOT);

    const body = {
      latitude: 48.8566,
      longitude: 2.3522,
      photoUrl: "https://cdn.example.com/photo.jpg",
      photoKey: "spots/user-1/photo.jpg",
      title: "Eiffel Tower",
      compositions: ["SYMMETRY"],
      colors: ["#D4A574"],
      tags: ["sunset"],
    };

    const res = await POST(makePostRequest(body), undefined as never);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.data.title).toBe("Eiffel Tower");
    expect(mockSpotCreate).toHaveBeenCalledOnce();
  });

  it("returns 401 for unauthenticated requests", async () => {
    mockGetUserFromRequest.mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/spots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latitude: 48, longitude: 2 }),
    });

    const res = await POST(req, undefined as never);
    expect(res.status).toBe(401);
  });
});

describe("GET /api/spots/[id]", () => {
  beforeEach(() => {
    resetPrismaMocks();
    // A spot is only visible to its owner and accepted followers.
    // View as the owner unless a test says otherwise.
    mockGetUserFromRequest.mockResolvedValue(OWNER);
  });

  it("returns a single spot", async () => {
    mockSpotFindUnique.mockResolvedValue(SAMPLE_SPOT);

    const req = new NextRequest("http://localhost/api/spots/spot-1");
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: "spot-1" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.id).toBe("spot-1");
  });

  it("returns 404 for unauthenticated viewers", async () => {
    mockSpotFindUnique.mockResolvedValue(SAMPLE_SPOT);
    mockGetUserFromRequest.mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/spots/spot-1");
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: "spot-1" }) });

    expect(res.status).toBe(404);
  });

  it("returns the spot to an accepted follower", async () => {
    mockSpotFindUnique.mockResolvedValue(SAMPLE_SPOT);
    mockGetUserFromRequest.mockResolvedValue(OTHER_VIEWER);
    mockFollowFindUnique.mockResolvedValue({ status: "ACCEPTED" });

    const req = new NextRequest("http://localhost/api/spots/spot-1");
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: "spot-1" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.id).toBe("spot-1");
    expect(mockFollowFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          followerId_followingId: {
            followerId: OTHER_VIEWER.userId,
            followingId: OWNER.userId,
          },
        },
      }),
    );
  });

  it("returns 404 to a viewer who does not follow the owner", async () => {
    mockSpotFindUnique.mockResolvedValue(SAMPLE_SPOT);
    mockGetUserFromRequest.mockResolvedValue(OTHER_VIEWER);

    const req = new NextRequest("http://localhost/api/spots/spot-1");
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: "spot-1" }) });

    expect(res.status).toBe(404);
  });

  it("returns 404 for a PRIVATE spot even to an accepted follower", async () => {
    mockSpotFindUnique.mockResolvedValue({ ...SAMPLE_SPOT, visibility: "PRIVATE" });
    mockGetUserFromRequest.mockResolvedValue(OTHER_VIEWER);
    mockFollowFindUnique.mockResolvedValue({ status: "ACCEPTED" });

    const req = new NextRequest("http://localhost/api/spots/spot-1");
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: "spot-1" }) });

    expect(res.status).toBe(404);
    expect(mockFollowFindUnique).not.toHaveBeenCalled();
  });

  it("returns 404 for non-existent spot", async () => {
    mockSpotFindUnique.mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/spots/nonexistent");
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: "nonexistent" }) });

    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/spots/[id]", () => {
  beforeEach(() => {
    resetPrismaMocks();
    mockGetUserFromRequest.mockResolvedValue(OWNER);
  });

  it("updates a spot owned by the user", async () => {
    mockSpotFindUnique.mockResolvedValue(SAMPLE_SPOT);
    mockSpotUpdate.mockResolvedValue({ ...SAMPLE_SPOT, title: "Updated Title" });

    const req = new NextRequest("http://localhost/api/spots/spot-1", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer mock-token",
      },
      body: JSON.stringify({ title: "Updated Title" }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: "spot-1" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.title).toBe("Updated Title");
  });

  it("returns 403 when non-owner tries to update", async () => {
    mockSpotFindUnique.mockResolvedValue({
      ...SAMPLE_SPOT,
      userId: "user-other",
    });

    const req = new NextRequest("http://localhost/api/spots/spot-1", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer mock-token",
      },
      body: JSON.stringify({ title: "Hacked" }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: "spot-1" }) });
    expect(res.status).toBe(403);
  });
});

describe("DELETE /api/spots/[id]", () => {
  beforeEach(() => {
    resetPrismaMocks();
    mockGetUserFromRequest.mockResolvedValue(OWNER);
  });

  it("deletes a spot owned by the user", async () => {
    mockSpotFindUnique.mockResolvedValue(SAMPLE_SPOT);
    mockSpotDelete.mockResolvedValue(SAMPLE_SPOT);

    const req = new NextRequest("http://localhost/api/spots/spot-1", {
      method: "DELETE",
      headers: { Authorization: "Bearer mock-token" },
    });

    const res = await DELETE(req, { params: Promise.resolve({ id: "spot-1" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.id).toBe("spot-1");
    expect(mockSpotDelete).toHaveBeenCalledOnce();
  });

  it("returns 403 when non-owner tries to delete", async () => {
    mockSpotFindUnique.mockResolvedValue({
      ...SAMPLE_SPOT,
      userId: "user-other",
    });

    const req = new NextRequest("http://localhost/api/spots/spot-1", {
      method: "DELETE",
      headers: { Authorization: "Bearer mock-token" },
    });

    const res = await DELETE(req, { params: Promise.resolve({ id: "spot-1" }) });
    expect(res.status).toBe(403);
  });

  it("returns 404 for non-existent spot", async () => {
    mockSpotFindUnique.mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/spots/nonexistent", {
      method: "DELETE",
      headers: { Authorization: "Bearer mock-token" },
    });

    const res = await DELETE(req, { params: Promise.resolve({ id: "nonexistent" }) });
    expect(res.status).toBe(404);
  });
});
