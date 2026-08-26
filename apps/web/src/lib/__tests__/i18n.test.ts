import { describe, expect, it } from "vitest";
import { t, en, fr } from "../i18n";

describe("i18n", () => {
  describe("t()", () => {
    it("returns a top-level key", () => {
      expect(t("common.loading")).toBe("Loading...");
    });

    it("returns a nested key", () => {
      expect(t("auth.errors.passwordTooShort")).toBe(
        "Password must be at least 8 characters",
      );
    });

    it("returns the key itself when path is invalid", () => {
      expect(t("nonexistent.key")).toBe("nonexistent.key");
    });

    it("interpolates {{param}} placeholders", () => {
      expect(t("auth.continueWith", { provider: "Google" })).toBe(
        "Continue with Google",
      );
    });

    it("leaves unmatched placeholders intact", () => {
      expect(t("auth.continueWith")).toBe("Continue with {{provider}}");
    });

    it("supports French locale", () => {
      expect(t("auth.login", undefined, "fr")).toBe("Se connecter");
    });

    it("supports numeric param values", () => {
      expect(t("users.spots", { count: 42 })).toBe("42 spots");
    });
  });

  describe("exports", () => {
    it("exports en translations", () => {
      expect(en.common.loading).toBe("Loading...");
    });

    it("exports fr translations", () => {
      expect(fr.common.loading).toBe("Chargement...");
    });
  });
});
