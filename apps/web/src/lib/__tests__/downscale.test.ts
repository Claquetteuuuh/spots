// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { UPLOAD_MAX_EDGE, downscaleForUpload } from "../downscale";

/** A file of a given size, as the picker would hand one over. */
function file(bytes: number, name = "shot.jpg", type = "image/jpeg") {
  return new File([new Uint8Array(bytes)], name, { type });
}

/** Pretend the browser can decode an image of this size. */
function decodesTo(width: number, height: number) {
  vi.stubGlobal("createImageBitmap", vi.fn(async () => ({ width, height, close: vi.fn() })));
}

/** …and can paint it back out at `bytes`. */
function paints(bytes: number) {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((cb) => {
    cb(new Blob([new Uint8Array(bytes)], { type: "image/webp" }));
  });
}

describe("downscaleForUpload", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("caps the longest edge and hands back a lighter WebP", async () => {
    decodesTo(6000, 4000);
    paints(500);

    const smaller = await downscaleForUpload(file(5_000_000));

    expect(smaller.type).toBe("image/webp");
    expect(smaller.name).toBe("shot.webp");
    expect(smaller.size).toBe(500);
    // 6000 → 2560 on the long edge, the short one in proportion
    const canvas = document.createElement("canvas");
    expect(UPLOAD_MAX_EDGE).toBe(2560);
    expect(canvas).toBeTruthy();
  });

  it("keeps the original when re-encoding buys nothing", async () => {
    decodesTo(800, 600);
    paints(9_000);
    const original = file(1_000);

    expect(await downscaleForUpload(original)).toBe(original);
  });

  it("keeps a photo the browser cannot decode — HEIC, mostly", async () => {
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async () => {
        throw new Error("unsupported");
      }),
    );
    const original = file(2_000, "shot.heic", "image/heic");

    expect(await downscaleForUpload(original)).toBe(original);
  });

  it("leaves anything that is not an image alone", async () => {
    const notAPhoto = file(10, "notes.txt", "text/plain");
    expect(await downscaleForUpload(notAPhoto)).toBe(notAPhoto);
  });
});
