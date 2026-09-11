import { describe, it, expect, vi, beforeEach } from "vitest";
import sharp from "sharp";

// heic-convert is pure-JS HEVC decoding; we can't produce a real HEIC
// fixture without an encoder, so the module is mocked and the pipeline
// around it is what gets tested.
const mockHeicConvert = vi.fn();
vi.mock("heic-convert", () => ({
  default: (...args: unknown[]) => mockHeicConvert(...args),
}));

import {
  compressImage,
  PHOTO_MAX_EDGE,
  PHOTO_OUTPUT_CONTENT_TYPE,
} from "../image";
import { ApiError } from "../api-utils";

/** A solid-colour image — fast to generate, enough for geometry checks. */
function solid(width: number, height: number) {
  return sharp({
    create: { width, height, channels: 3, background: "#4574C4" },
  });
}

/** Gaussian noise — incompressible, so a lossless PNG of it is huge. */
function noise(width: number, height: number) {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: "#808080",
      noise: { type: "gaussian", mean: 128, sigma: 30 },
    },
  });
}

describe("compressImage", () => {
  beforeEach(() => {
    mockHeicConvert.mockReset();
  });

  it("re-encodes everything as WebP", async () => {
    const png = await solid(800, 600).png().toBuffer();
    const out = await compressImage(png, "image/png");

    expect(out.contentType).toBe("image/webp");
    expect(out.extension).toBe("webp");
    expect(out.inputBytes).toBe(png.byteLength);
    expect(out.outputBytes).toBe(out.buffer.byteLength);

    const meta = await sharp(out.buffer).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.width).toBe(800);
    expect(meta.height).toBe(600);
  });

  it("caps the longest edge at PHOTO_MAX_EDGE and keeps the aspect ratio", async () => {
    // A 12 MP 4:3 landscape, like a phone camera
    const jpeg = await solid(4000, 3000).jpeg().toBuffer();
    const out = await compressImage(jpeg, "image/jpeg");

    expect(out.width).toBe(PHOTO_MAX_EDGE);
    expect(out.height).toBe(Math.round((PHOTO_MAX_EDGE * 3) / 4));
  });

  it("caps portrait images on their height", async () => {
    const jpeg = await solid(3000, 4000).jpeg().toBuffer();
    const out = await compressImage(jpeg, "image/jpeg");

    expect(out.height).toBe(PHOTO_MAX_EDGE);
    expect(out.width).toBe(Math.round((PHOTO_MAX_EDGE * 3) / 4));
  });

  it("never upscales a small image", async () => {
    const jpeg = await solid(640, 480).jpeg().toBuffer();
    const out = await compressImage(jpeg, "image/jpeg");

    expect(out.width).toBe(640);
    expect(out.height).toBe(480);
  });

  it("produces a much smaller file than a lossless source", async () => {
    const png = await noise(1600, 1200).png().toBuffer();
    const out = await compressImage(png, "image/png");

    // Lossless noise is ~5.7 MB; lossy WebP of the same pixels is a fraction.
    expect(out.outputBytes).toBeLessThan(png.byteLength / 3);
  });

  it("produces a smaller file than an oversized JPEG", async () => {
    // Noise at 3600×2400 (8.6 MP) → downscaled to 2560×1707 (4.4 MP)
    const jpeg = await noise(3600, 2400).jpeg({ quality: 92 }).toBuffer();
    const out = await compressImage(jpeg, "image/jpeg");

    expect(out.width).toBe(PHOTO_MAX_EDGE);
    expect(out.outputBytes).toBeLessThan(jpeg.byteLength);
  });

  it("applies EXIF orientation to the pixels and drops the tag", async () => {
    // A 400×200 image tagged "rotate 90° clockwise" is displayed as 200×400.
    const jpeg = await solid(400, 200)
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer();
    const before = await sharp(jpeg).metadata();
    expect(before.orientation).toBe(6);

    const out = await compressImage(jpeg, "image/jpeg");
    expect(out.width).toBe(200);
    expect(out.height).toBe(400);

    const after = await sharp(out.buffer).metadata();
    expect(after.orientation).toBeUndefined();
  });

  it("strips EXIF metadata", async () => {
    const jpeg = await solid(300, 300)
      .jpeg()
      .withMetadata({
        exif: { IFD0: { Copyright: "someone", ImageDescription: "gps-ish" } },
      })
      .toBuffer();
    const before = await sharp(jpeg).metadata();
    expect(before.exif).toBeDefined();

    const out = await compressImage(jpeg, "image/jpeg");
    const after = await sharp(out.buffer).metadata();
    expect(after.exif).toBeUndefined();
  });

  it("keeps transparency from PNG sources", async () => {
    const png = await sharp({
      create: {
        width: 200,
        height: 200,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .png()
      .toBuffer();

    const out = await compressImage(png, "image/png");
    const meta = await sharp(out.buffer).metadata();
    expect(meta.hasAlpha).toBe(true);
  });

  it("decodes HEIC through heic-convert before compressing", async () => {
    const jpeg = await solid(3000, 2000).jpeg().toBuffer();
    mockHeicConvert.mockResolvedValue(
      jpeg.buffer.slice(jpeg.byteOffset, jpeg.byteOffset + jpeg.byteLength),
    );

    const fakeHeic = Buffer.from("not-really-heic");
    const out = await compressImage(fakeHeic, "image/heic");

    expect(mockHeicConvert).toHaveBeenCalledOnce();
    expect(mockHeicConvert.mock.calls[0][0]).toMatchObject({
      buffer: fakeHeic,
      format: "JPEG",
    });
    expect(out.contentType).toBe(PHOTO_OUTPUT_CONTENT_TYPE);
    expect(out.width).toBe(PHOTO_MAX_EDGE);
    expect(out.inputBytes).toBe(fakeHeic.byteLength);
  });

  it("does not touch heic-convert for non-HEIC input", async () => {
    const jpeg = await solid(100, 100).jpeg().toBuffer();
    await compressImage(jpeg, "image/jpeg");
    expect(mockHeicConvert).not.toHaveBeenCalled();
  });

  it("rejects an undecodable HEIC with a 400", async () => {
    mockHeicConvert.mockRejectedValue(new Error("boom"));

    await expect(
      compressImage(Buffer.from("garbage"), "image/heic"),
    ).rejects.toSatisfy((error: unknown) => {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(400);
      expect((error as ApiError).message).toMatch(/HEIC/);
      return true;
    });
  });

  it("rejects bytes that are not an image with a 400", async () => {
    await expect(
      compressImage(Buffer.from("%PDF-1.4 definitely not a photo"), "image/jpeg"),
    ).rejects.toSatisfy((error: unknown) => {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(400);
      return true;
    });
  });

  it("rejects a truncated JPEG with a 400", async () => {
    const jpeg = await noise(800, 600).jpeg().toBuffer();
    const truncated = jpeg.subarray(0, Math.floor(jpeg.byteLength / 2));

    await expect(compressImage(truncated, "image/jpeg")).rejects.toBeInstanceOf(
      ApiError,
    );
  });
});
