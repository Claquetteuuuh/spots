import tseslint from "typescript-eslint";

export default tseslint.config(
  ...tseslint.configs.recommended,
  {
    ignores: [
      ".expo/**",
      "node_modules/**",
      "babel.config.js",
      "metro.config.js",
      "jest.config.js",
    ],
  },
  {
    rules: {
      // Allow explicit any — pre-existing codebase patterns.
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow require() for React Native asset imports.
      "@typescript-eslint/no-require-imports": "off",
    },
  },
);
