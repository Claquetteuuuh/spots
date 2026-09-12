import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";

// framer-motion resolves its own React copy under vitest (see vitest.config),
// which breaks hooks: every test gets plain elements instead of motion ones.
vi.mock("framer-motion", () => import("@/test/framer-motion-mock"));
