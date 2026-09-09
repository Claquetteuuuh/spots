import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @aws-sdk/client-s3 before importing storage
const mockSend = vi.fn().mockResolvedValue({});
vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn().mockImplementation(() => ({ send: mockSend })),
  PutObjectCommand: vi.fn().mockImplementation((input) => ({ ...input, _type: "PutObject" })),
  DeleteObjectCommand: vi.fn().mockImplementation((input) => ({ ...input, _type: "DeleteObject" })),
}));

describe("storage", () => {
  beforeEach(() => {
    vi.resetModules();
    mockSend.mockClear();

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
