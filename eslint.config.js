import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import eslintPluginSvelte from "eslint-plugin-svelte";
import globals from "globals";
import svelteParser from "svelte-eslint-parser";
import tsEslint from "typescript-eslint";

export default [
  js.configs.recommended,
  ...tsEslint.configs.strict,
  ...eslintPluginSvelte.configs["flat/recommended"],
  ...eslintPluginSvelte.configs["flat/prettier"],
  {
    rules: {
      "no-undef": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { ignoreRestSiblings: true },
      ],
      // TODO for the reason of next 2 rules see https://github.com/eslint/eslint/issues/19134#issuecomment-2480588649
      "@typescript-eslint/no-unused-expressions": [
        "error",
        {
          allowShortCircuit: true,
          allowTernary: true,
        },
      ],
      "@typescript-eslint/no-empty-function": [
        "error",
        { allow: ["arrowFunctions"] },
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
  },
];
