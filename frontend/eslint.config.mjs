import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

// Vite-friendly flat ESLint config (no Next.js dependency).
// Relaxed rules to match the existing codebase; primarily catches syntax/parse
// errors and obvious issues.
export default [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      ".next/**",
      "dev.log",
      "examples/**",
      "skills/**",
      "mini-services/**",
      "src/app/**",
      "src/lib/db.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx,js,jsx,mjs}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-empty-function": "off",
      "no-empty": "off",
      "no-case-declarations": "off",
      "no-fallthrough": "off",
      "no-irregular-whitespace": "off",
      "no-useless-escape": "off",
      "no-unreachable": "off",
      "no-console": "off",
      "no-debugger": "off",
      "prefer-const": "off",
      "no-mixed-spaces-and-tabs": "off",
      "no-redeclare": "off",
      "no-inner-declarations": "off",
    },
  },
];
