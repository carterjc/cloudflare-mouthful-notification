import js from "@eslint/js";
import globals from "globals";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/.wrangler/**",
      "**/dist/**",
      ".yarn/**"
    ]
  },
  js.configs.recommended,
  {
    files: ["**/*.ts"],
    plugins: {
      "@typescript-eslint": tsPlugin
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ["./apps/mouthful-worker/tsconfig.json"],
        tsconfigRootDir: import.meta.dirname
      },
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2022
      }
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...tsPlugin.configs.stylistic.rules,
      "no-undef": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ]
    }
  }
];
