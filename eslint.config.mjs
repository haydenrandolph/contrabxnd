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
  ]),
  {
    rules: {
      // Lesson and writing content is prose-heavy; raw apostrophes/quotes in
      // JSX text are intentional and render fine. This rule is pure noise here.
      "react/no-unescaped-entities": "off",
    },
  },
]);

export default eslintConfig;
