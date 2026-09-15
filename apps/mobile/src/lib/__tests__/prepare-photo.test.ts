import { UPLOAD_PRESETS } from "@trs/shared/constants";
import { preparePhoto, weighPhoto } from "../prepare-photo";

// `mock`-prefixed so the factory below may reach them
const mockResize = jest.fn<void, [unknown]>();
const mockSaveAsync = jest.fn<Promise<{ uri: string }>, [unknown]>(async () => ({
  uri: "file:///small.jpg",
}));

jest.mock("expo-image-manipulator", () => ({
  SaveFormat: { JPEG: "jpeg" },
  ImageManipulator: {
    manipulate: jest.fn(() => ({
      resize: (options: unknown) => mockResize(options),
      renderAsync: async () => ({ saveAsync: (options: unknown) => mockSaveAsync(options) }),
    })),
  },
}));

jest.mock("expo-file-system", () => ({
  File: jest.fn().mockImplementation((uri: string) => ({
    size: uri === "file:///missing.jpg" ? null : 123_456,
  })),
}));

describe("preparePhoto", () => {
  beforeEach(() => jest.clearAllMocks());

  it("draws a community photo the way a messaging app would", async () => {
    const prepared = await preparePhoto("file:///huge.heic", "huge.heic");

    expect(mockResize).toHaveBeenCalledWith({ width: UPLOAD_PRESETS.community.maxEdge });
    expect(mockSaveAsync).toHaveBeenCalledWith(
      expect.objectContaining({ compress: UPLOAD_PRESETS.community.quality }),
    );
    // …and it is the re-encoded file that travels, not the original
    expect(prepared.uri).toBe("file:///small.jpg");
    expect(prepared.fileName).toBe("huge.heic");
  });

  it("keeps a spot's own photo a notch above", async () => {
    await preparePhoto("file:///cover.jpg", "cover.jpg", UPLOAD_PRESETS.spot);

    expect(mockResize).toHaveBeenCalledWith({ width: UPLOAD_PRESETS.spot.maxEdge });
  });

  it("sends the original when the phone cannot re-encode it", async () => {
    mockSaveAsync.mockRejectedValueOnce(new Error("no codec"));

    const prepared = await preparePhoto("file:///odd.tiff", "odd.tiff");

    expect(prepared).toEqual({ uri: "file:///odd.tiff", fileName: "odd.tiff" });
  });

  it("weighs what it prepared, and shrugs when the file system will not say", () => {
    expect(weighPhoto({ uri: "file:///small.jpg" })).toBe(123_456);
    expect(weighPhoto({ uri: "file:///missing.jpg" })).toBe(0);
  });
});
