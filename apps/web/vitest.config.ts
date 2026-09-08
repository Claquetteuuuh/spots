import { createRequire } from "node:module";
import path from "node:path";
import { defineConfig } from "vitest/config";

// react-dom bundles its own react copy under node_modules/react-dom/node_modules/react.
// Without aliasing, component code imports a DIFFERENT react instance
// (apps/web/node_modules/react), causing "Invalid hook call" in tests.
// Force everything to share the same React instance that react-dom uses.
const require = createRequire(import.meta.url);
const reactDomDir = path.dirname(
  require.resolve("react-dom/package.json"),
);
const sharedReact = path.resolve(reactDomDir, "node_modules/react");

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    setupFiles: ["./src/test-setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      react: sharedReact,
    },
  },
});
