// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { MAX_PHOTO_SIZE_BYTES, MAX_POST_BYTES, UPLOAD_PRESETS } from "@trs/shared/constants";
import { en } from "@trs/shared/i18n";
import { downscaleForUpload, isUsablePhoto, prepareForUpload } from "../downscale";

/** A file of a given size, as the picker would hand one over. */
function file(bytes: number, name = "shot.jpg", type = "image/jpeg") {
  return new File([new Uint8Array(bytes)], name, { type });
}

/** Pretend the browser can decode an image of this size. */
function decodesTo(width: number, height: number) {
  vi.stubGlobal("createImageBitmap", vi.fn(async () => ({ width, height, close: vi.fn() })));
}

/** Pretend only an <img> can decode it — Safari's answer for HEIC. */
function stubImageDecoding(width: number, height: number) {
  vi.stubGlobal("URL", { ...URL, createObjectURL: () => "blob:x", revokeObjectURL: () => {} });
  Object.defineProperty(Image.prototype, "src", {
    configurable: true,
    set(this: HTMLImageElement) {
      Object.defineProperty(this, "width", { value: width, configurable: true });
      Object.defineProperty(this, "height", { value: height, configurable: true });
      setTimeout(() => this.onload?.(new Event("load")), 0);
    },
  });
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
    // Drawn down to the community preset, which is what travels
    expect(UPLOAD_PRESETS.community.maxEdge).toBe(1600);
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

// ─── A whole post, small enough to leave ─────────────────────────────

describe("prepareForUpload", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("decodes what createImageBitmap cannot — an iPhone's HEIC", async () => {
    // Safari refuses HEIC here, yet draws it happily in an <img>
    vi.stubGlobal("createImageBitmap", vi.fn(async () => {
      throw new Error("unsupported");
    }));
    stubImageDecoding(4032, 3024);
    paints(400_000);

    const [prepared] = await prepareForUpload([file(6_000_000, "IMG_0001.HEIC", "image/heic")]);

    // …and the 6 MB original is not what travels
    expect(prepared.type).toBe("image/webp");
    expect(prepared.size).toBe(400_000);
  });

  it("draws the post smaller again until it fits the wire", async () => {
    decodesTo(4032, 3024);
    // The first pass is still over budget; the second one fits
    const sizes = [3_000_000, 900_000];
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    let pass = 0;
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((cb) => {
      const size = sizes[Math.min(Math.floor(pass++ / 2), sizes.length - 1)];
      cb(new Blob([new Uint8Array(size)], { type: "image/webp" }));
    });

    const prepared = await prepareForUpload([file(9_000_000), file(9_000_000)]);

    expect(prepared.reduce((n, f) => n + f.size, 0)).toBeLessThanOrEqual(MAX_POST_BYTES);
  });

  it("says so rather than letting the platform answer 413", async () => {
    decodesTo(4032, 3024);
    paints(3_000_000); // every pass stays over budget

    await expect(prepareForUpload([file(9_000_000), file(9_000_000)])).rejects.toThrow(
      en.spotPhotos.tooHeavy,
    );
  });
});

// ─── A spot's own photos ─────────────────────────────────────────────

describe("presets", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("draws a community photo smaller than a spot's own", async () => {
    decodesTo(6000, 4000);
    paints(200_000);
    // …after `paints`, which stubs the same method
    const widths: number[] = [];
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(function (
      this: HTMLCanvasElement,
    ) {
      widths.push(this.width);
      return { drawImage: vi.fn() } as unknown as CanvasRenderingContext2D;
    });

    await downscaleForUpload(file(5_000_000), UPLOAD_PRESETS.spot);
    await downscaleForUpload(file(5_000_000), UPLOAD_PRESETS.community);

    // 6000px on the long edge, drawn down to each preset
    expect(widths).toEqual([UPLOAD_PRESETS.spot.maxEdge, UPLOAD_PRESETS.community.maxEdge]);
  });
});

// ─── What a photographer is allowed to pick ──────────────────────────

describe("isUsablePhoto", () => {
  it("takes the formats a camera and a phone produce", () => {
    expect(isUsablePhoto(file(1_000, "shot.jpg", "image/jpeg"))).toBe(true);
    expect(isUsablePhoto(file(1_000, "shot.png", "image/png"))).toBe(true);
    expect(isUsablePhoto(file(1_000, "shot.heic", "image/heic"))).toBe(true);
  });

  it("takes an iPhone's HEIC even when the browser names no type for it", () => {
    // Safari hands these over with an empty MIME type; refusing them is
    // what put an avatar's "2MB max" in front of a 6MB photo.
    expect(isUsablePhoto(file(6_000_000, "IMG_0001.HEIC", ""))).toBe(true);
  });

  it("refuses what is not a photo at all", () => {
    expect(isUsablePhoto(file(1_000, "notes.txt", "text/plain"))).toBe(false);
    expect(isUsablePhoto(file(1_000, "archive.zip", ""))).toBe(false);
  });

  it("refuses only what the device cannot be asked to decode", () => {
    expect(isUsablePhoto(file(MAX_PHOTO_SIZE_BYTES, "big.jpg", "image/jpeg"))).toBe(true);
    expect(isUsablePhoto(file(MAX_PHOTO_SIZE_BYTES + 1, "huge.jpg", "image/jpeg"))).toBe(false);
    // …which is the 30MB a modern phone can reach, not 20
    expect(MAX_PHOTO_SIZE_BYTES).toBe(30 * 1024 * 1024);
  });
});
