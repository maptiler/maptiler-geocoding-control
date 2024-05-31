import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
// import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import eslintPluginSvelte from "eslint-plugin-svelte";
import globals from "globals";
import svelteParser from "svelte-eslint-parser";
import tsEslint from "typescript-eslint";

export default [
  js.configs.recommended,
  ...tsEslint.configs.strict,
  ...eslintPluginSvelte.configs["flat/recommended"],
  ...eslintPluginSvelte.configs["flat/prettier"],
  // eslintPluginPrettierRecommended, // must be last to override conflicting rules.
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { ignoreRestSiblings: true },
      ],
    },
  },
  {
    ignores: [
      "dist/",
      "dist.svelte/",
      ".svelte-kit/",
      "replace-env-vars.js",
      "eslint.config.js",
      "svelte.config.js",
    ],
  },
  {
    files: ["**/*.svelte"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        RequestInit: false,
      },
      parser: svelteParser,
      parserOptions: {
        parser: tsParser,
        // project: true,
        extraFileExtensions: [".svelte"],
      },
    },
    rules: {
      "svelte/no-target-blank": "error",
      "svelte/no-at-debug-tags": "error",
      "svelte/no-reactive-functions": "error",
      "svelte/no-reactive-literals": "error",
    },
  },
];
