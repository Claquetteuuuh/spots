import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @aws-sdk/client-s3 before importing storage
const mockSend = vi.fn().mockResolvedValue({});
vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn().mockImplementation(() => ({ send: mockSend })),
  PutObjectCommand: vi.fn().mockImplementation((input) => ({ ...input, _type: "PutObject" })),
  DeleteObjectCommand: vi.fn().mockImplementation((input) => ({ ...input, _type: "DeleteObject" })),
  DeleteObjectsCommand: vi.fn().mockImplementation((input) => ({ ...input, _type: "DeleteObjects" })),
  ListObjectsV2Command: vi.fn().mockImplementation((input) => ({ ...input, _type: "ListObjectsV2" })),
}));

describe("storage", () => {
  beforeEach(() => {
    vi.resetModules();
    mockSend.mockReset();
    mockSend.mockResolvedValue({});

    process.env.R2_ACCOUNT_ID = "test-account-id";
    process.env.R2_ACCESS_KEY_ID = "test-access-key";
    process.env.R2_SECRET_ACCESS_KEY = "test-secret-key";
    process.env.R2_BUCKET_NAME = "test-bucket";
    process.env.R2_PUBLIC_URL = "https://cdn.example.com";
  });

  it("uploadFile sends PutObjectCommand and returns public URL", async () => {
    const { uploadFile } = await import("@/lib/storage");
    const body = Buffer.from("fake-image-data");
    const url = await uploadFile("spots/user1/photo.jpg", body, "image/jpeg");

    expect(mockSend).toHaveBeenCalledOnce();
    expect(url).toBe("https://cdn.example.com/spots/user1/photo.jpg");
  });

  it("deleteFile sends DeleteObjectCommand", async () => {
    const { deleteFile } = await import("@/lib/storage");
    await deleteFile("spots/user1/photo.jpg");

    expect(mockSend).toHaveBeenCalledOnce();
  });

  describe("deleteFiles", () => {
    it("deletes several keys in one DeleteObjects call, deduplicated", async () => {
      const { deleteFiles } = await import("@/lib/storage");
      await deleteFiles(["a.webp", "b.webp", "a.webp", ""]);

      expect(mockSend).toHaveBeenCalledOnce();
      const command = mockSend.mock.calls[0][0];
      expect(command._type).toBe("DeleteObjects");
      expect(command.Bucket).toBe("test-bucket");
      expect(command.Delete.Objects).toEqual([{ Key: "a.webp" }, { Key: "b.webp" }]);
    });

    it("never touches the network for an empty list", async () => {
      const { deleteFiles } = await import("@/lib/storage");
      await deleteFiles([]);
      await deleteFiles(["", ""]);

      expect(mockSend).not.toHaveBeenCalled();
    });

    it("splits more than 1000 keys into several calls", async () => {
      const { deleteFiles } = await import("@/lib/storage");
      const keys = Array.from({ length: 1500 }, (_, i) => `k${i}.webp`);
      await deleteFiles(keys);

      expect(mockSend).toHaveBeenCalledTimes(2);
      expect(mockSend.mock.calls[0][0].Delete.Objects).toHaveLength(1000);
      expect(mockSend.mock.calls[1][0].Delete.Objects).toHaveLength(500);
    });

    it("throws when the bucket reports per-key errors", async () => {
      mockSend.mockResolvedValue({
        Errors: [{ Key: "b.webp", Code: "AccessDenied" }],
      });
      const { deleteFiles } = await import("@/lib/storage");

      await expect(deleteFiles(["a.webp", "b.webp"])).rejects.toThrow(
        /b\.webp \(AccessDenied\)/,
      );
    });
  });

  describe("listAllObjects", () => {
    it("follows continuation tokens and flattens the pages", async () => {
      mockSend
        .mockResolvedValueOnce({
          Contents: [{ Key: "a.webp", Size: 10, LastModified: new Date("2026-01-01") }],
          IsTruncated: true,
          NextContinuationToken: "page-2",
        })
        .mockResolvedValueOnce({
          Contents: [{ Key: "b.webp", Size: 20, LastModified: new Date("2026-01-02") }],
          IsTruncated: false,
        });
      const { listAllObjects } = await import("@/lib/storage");

      const objects = await listAllObjects("spots/");

      expect(mockSend).toHaveBeenCalledTimes(2);
      expect(mockSend.mock.calls[0][0].Prefix).toBe("spots/");
      expect(mockSend.mock.calls[1][0].ContinuationToken).toBe("page-2");
      expect(objects.map((o) => o.key)).toEqual(["a.webp", "b.webp"]);
      expect(objects[1].size).toBe(20);
    });
  });

  describe("keyFromUrl", () => {
    it("returns the key behind one of our public URLs", async () => {
      const { keyFromUrl } = await import("@/lib/storage");
      expect(keyFromUrl("https://cdn.example.com/avatars/u1/a.jpg")).toBe("avatars/u1/a.jpg");
    });

    it("ignores query strings and decodes escaped characters", async () => {
      const { keyFromUrl } = await import("@/lib/storage");
      expect(keyFromUrl("https://cdn.example.com/spots/u1/a%20b.webp?x=1#f")).toBe(
        "spots/u1/a b.webp",
      );
    });

    it("tolerates a trailing slash on R2_PUBLIC_URL", async () => {
      process.env.R2_PUBLIC_URL = "https://cdn.example.com/";
      const { keyFromUrl } = await import("@/lib/storage");
      expect(keyFromUrl("https://cdn.example.com/spots/u1/a.webp")).toBe("spots/u1/a.webp");
    });

    it("returns null for anything that is not ours", async () => {
      const { keyFromUrl } = await import("@/lib/storage");
      expect(keyFromUrl("https://api.dicebear.com/9.x/bottts/svg?seed=x")).toBeNull();
      expect(keyFromUrl("https://cdn.example.com.evil.io/spots/a.webp")).toBeNull();
      expect(keyFromUrl("https://cdn.example.com/")).toBeNull();
      expect(keyFromUrl(null)).toBeNull();
      expect(keyFromUrl(undefined)).toBeNull();
    });

    it("returns null when storage is not configured instead of throwing", async () => {
      delete process.env.R2_PUBLIC_URL;
      const { keyFromUrl } = await import("@/lib/storage");
      expect(keyFromUrl("https://cdn.example.com/spots/u1/a.webp")).toBeNull();
    });
  });

  it("getFileUrl builds correct URL", async () => {
    const { getFileUrl } = await import("@/lib/storage");
    const url = getFileUrl("spots/user1/photo.jpg");

    expect(url).toBe("https://cdn.example.com/spots/user1/photo.jpg");
  });

  it("getFileUrl strips trailing slash from R2_PUBLIC_URL", async () => {
    process.env.R2_PUBLIC_URL = "https://cdn.example.com/";
    const { getFileUrl } = await import("@/lib/storage");
    const url = getFileUrl("spots/user1/photo.jpg");

    expect(url).toBe("https://cdn.example.com/spots/user1/photo.jpg");
  });

  it("throws when R2_ACCOUNT_ID is missing", async () => {
    delete process.env.R2_ACCOUNT_ID;
    const { uploadFile } = await import("@/lib/storage");

    await expect(
      uploadFile("key", Buffer.from("data"), "image/jpeg")
    ).rejects.toThrow(/not configured.*R2_ACCOUNT_ID/);
  });

  it("throws when R2_PUBLIC_URL is missing", async () => {
    delete process.env.R2_PUBLIC_URL;
    const { getFileUrl } = await import("@/lib/storage");

    expect(() => getFileUrl("key")).toThrow(
      /not configured.*R2_PUBLIC_URL/
    );
  });

  describe("when object storage is not configured", () => {
    it("names every missing variable and answers 503, not 500", async () => {
      for (const key of [
        "R2_ACCOUNT_ID",
        "R2_ACCESS_KEY_ID",
        "R2_SECRET_ACCESS_KEY",
        "R2_BUCKET_NAME",
        "R2_PUBLIC_URL",
      ]) {
        delete process.env[key];
      }

      const { uploadFile } = await import("@/lib/storage");
      const { ApiError } = await import("@/lib/api-utils");

      await expect(
        uploadFile("spots/user1/photo.jpg", Buffer.from("x"), "image/jpeg"),
      ).rejects.toSatisfy((error: unknown) => {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as InstanceType<typeof ApiError>;
        expect(apiError.status).toBe(503);
        // Listing all of them at once beats fixing one variable per attempt.
        expect(apiError.message).toContain("R2_ACCOUNT_ID");
        expect(apiError.message).toContain("R2_PUBLIC_URL");
        return true;
      });
    });

    it("reports only the variable that is actually missing", async () => {
      delete process.env.R2_BUCKET_NAME;

      const { getFileUrl } = await import("@/lib/storage");
      expect(() => getFileUrl("a/b.jpg")).toThrowError(/R2_BUCKET_NAME/);
    });
  });
});
