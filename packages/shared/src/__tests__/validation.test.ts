import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  createSpotSchema,
  updateProfileSchema,
  spotQuerySchema,
  userSearchSchema,
  reverseGeocodeSchema,
} from "../validation";

describe("registerSchema", () => {
  it("accepts valid input", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "SecurePass1!",
      username: "test_user",
      name: "Test User",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = registerSchema.safeParse({
      email: "not-an-email",
      password: "SecurePass1!",
      username: "test_user",
      name: "Test User",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "short",
      username: "test_user",
      name: "Test User",
    });
    expect(result.success).toBe(false);
  });

  it("rejects username with special characters", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "SecurePass1!",
      username: "test user!",
      name: "Test User",
    });
    expect(result.success).toBe(false);
  });

  it("accepts short username (no minimum length)", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "SecurePass1!",
      username: "ab",
      name: "Test User",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty username", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "SecurePass1!",
      username: "",
      name: "Test User",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password without uppercase", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "securepass1!",
      username: "test_user",
      name: "Test User",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password without special character", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "SecurePass12",
      username: "test_user",
      name: "Test User",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts valid input", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "mypassword",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("createSpotSchema", () => {
  it("accepts valid spot with all fields", () => {
    const result = createSpotSchema.safeParse({
      latitude: 48.8584,
      longitude: 2.2945,
      title: "Tour Eiffel",
      description: "Beautiful spot",
      isFree: true,
      colors: ["#FF5733", "#3498DB"],
      compositions: ["SYMMETRY", "FIBONACCI"],
      tags: ["sunset", "landmark"],
    });
    expect(result.success).toBe(true);
  });

  it("accepts minimal spot with only coordinates", () => {
    const result = createSpotSchema.safeParse({
      latitude: 48.8584,
      longitude: 2.2945,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.colors).toEqual([]);
      expect(result.data.compositions).toEqual([]);
      expect(result.data.tags).toEqual([]);
      expect(result.data.isFree).toBe(true);
    }
  });

  it("rejects latitude out of range", () => {
    const result = createSpotSchema.safeParse({
      latitude: 100,
      longitude: 2.2945,
    });
    expect(result.success).toBe(false);
  });

  it("rejects longitude out of range", () => {
    const result = createSpotSchema.safeParse({
      latitude: 48.8584,
      longitude: 200,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid hex color", () => {
    const result = createSpotSchema.safeParse({
      latitude: 48.8584,
      longitude: 2.2945,
      colors: ["not-a-color"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid composition type", () => {
    const result = createSpotSchema.safeParse({
      latitude: 48.8584,
      longitude: 2.2945,
      compositions: ["INVALID_TYPE"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects too many colors", () => {
    const colors = Array.from({ length: 11 }, (_, i) =>
      `#${i.toString().padStart(6, "0")}`
    );
    const result = createSpotSchema.safeParse({
      latitude: 48.8584,
      longitude: 2.2945,
      colors,
    });
    expect(result.success).toBe(false);
  });
});

describe("updateProfileSchema", () => {
  it("accepts partial updates", () => {
    const result = updateProfileSchema.safeParse({
      name: "New Name",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty object", () => {
    const result = updateProfileSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects invalid locale", () => {
    const result = updateProfileSchema.safeParse({
      locale: "de",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a DiceBear avatar URL", () => {
    const result = updateProfileSchema.safeParse({
      avatarUrl: "https://api.dicebear.com/9.x/bottts/svg?seed=alice&backgroundColor=b6e3f4",
    });
    expect(result.success).toBe(true);
  });

  it("accepts clearing the avatar", () => {
    const result = updateProfileSchema.safeParse({ avatarUrl: null });
    expect(result.success).toBe(true);
  });

  it("rejects an avatar URL from any other origin", () => {
    for (const avatarUrl of [
      "https://example.com/me.png",
      "https://api.dicebear.com.evil.io/9.x/bottts/svg?seed=x",
      "http://api.dicebear.com/9.x/bottts/svg?seed=x",
      "not a url",
    ]) {
      const result = updateProfileSchema.safeParse({ avatarUrl });
      expect(result.success, avatarUrl).toBe(false);
    }
  });
});

describe("spotQuerySchema", () => {
  it("applies default limit", () => {
    const result = spotQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
    }
  });

  it("coerces string limit to number", () => {
    const result = spotQuerySchema.safeParse({ limit: "10" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(10);
    }
  });

  it("rejects limit above max", () => {
    const result = spotQuerySchema.safeParse({ limit: 100 });
    expect(result.success).toBe(false);
  });
});

describe("userSearchSchema", () => {
  it("accepts valid search", () => {
    const result = userSearchSchema.safeParse({ q: "alice" });
    expect(result.success).toBe(true);
  });

  it("rejects empty query", () => {
    const result = userSearchSchema.safeParse({ q: "" });
    expect(result.success).toBe(false);
  });
});

describe("reverseGeocodeSchema", () => {
  it("accepts valid coordinates", () => {
    const result = reverseGeocodeSchema.safeParse({
      latitude: 48.8584,
      longitude: 2.2945,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing longitude", () => {
    const result = reverseGeocodeSchema.safeParse({
      latitude: 48.8584,
    });
    expect(result.success).toBe(false);
  });
});

// ─── Whitespace is not a character ──────────────────────────────────

describe("trimming", () => {
  it("accepts a username or email typed with a stray space, and stores it trimmed", () => {
    const result = registerSchema.safeParse({
      email: " alice@example.com ",
      password: "Sup3r$ecretPass!",
      username: " alice_1 ",
      name: "  Alice  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.username).toBe("alice_1");
      expect(result.data.email).toBe("alice@example.com");
      expect(result.data.name).toBe("Alice");
    }
    expect(updateProfileSchema.safeParse({ username: "bob " }).success).toBe(true);
    expect(updateProfileSchema.safeParse({ username: "bob smith" }).success).toBe(false);
  });

  it("accepts colours and tags with spaces around them", () => {
    const result = createSpotSchema.safeParse({
      latitude: 48.85,
      longitude: 2.35,
      colors: [" #C44536 "],
      tags: [" sunset "],
      title: "  Seine  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.colors).toEqual(["#C44536"]);
      expect(result.data.tags).toEqual(["sunset"]);
      expect(result.data.title).toBe("Seine");
    }
  });

  it("still refuses a blank name", () => {
    expect(updateProfileSchema.safeParse({ name: "   " }).success).toBe(false);
  });
});
