import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";

// framer-motion resolves its own React copy under vitest (see vitest.config),
// which breaks hooks: every test gets plain elements instead of motion ones.
vi.mock("framer-motion", () => import("@/test/framer-motion-mock"));

// jsdom fetches no image, so `img.src = …` fires neither load nor error
// and anything awaiting one would wait for ever. Report the failure,
// which is the truthful outcome of a browser that cannot decode.
// (only where there is a DOM at all — most suites run in node)
if (typeof Image !== "undefined") {
  Object.defineProperty(Image.prototype, "src", {
    configurable: true,
    set(this: HTMLImageElement) {
      setTimeout(() => this.onerror?.(new Event("error")), 0);
    },
  });
}
