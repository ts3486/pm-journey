import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Former .eslintignore entries:
    "node_modules/**",
    "dist/**",
    "coverage/**",
    ".env*",
    "package-lock.json",
    "pnpm-lock.yaml",
    "yarn.lock",
  ]),
]);

export default eslintConfig;
