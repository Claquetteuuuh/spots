import tseslint from "typescript-eslint";

// Same baseline as apps/mobile. `eslint` and `typescript-eslint` resolve through
// pnpm's public hoisting (`*eslint*`), which is also how the mobile app gets them.
export default tseslint.config(
  ...tseslint.configs.recommended,
  {
    ignores: ["dist/**", "coverage/**", "node_modules/**"],
  },
);
