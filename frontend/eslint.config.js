import pluginJs from "@eslint/js";
import eslintPluginImport from "eslint-plugin-import";
import pluginJsxA11y from "eslint-plugin-jsx-a11y";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import eslintPluginUnicorn from "eslint-plugin-unicorn";
import eslintPluginPrettier from "eslint-plugin-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";
import pluginRouter from "@tanstack/eslint-plugin-router";

export default [
  // PascalCase for components
  {
    files: [
      "src/components/**/*.{js,jsx,ts,tsx}",
      "src/pages/**/*.{js,jsx,ts,tsx}",
      "src/features/**/components/**/*.{js,jsx,ts,tsx}",
      "src/features/**/pages/**/*.{js,jsx,ts,tsx}",
    ],
    rules: {
      "unicorn/filename-case": [
        "error",
        {
          case: "pascalCase",
          multipleFileExtensions: false,
        },
      ],
    },
  },
  // camelCase for utils, types, store, and hooks
  {
    files: [
      "src/utils/**/*.{js,ts}",
      "src/types/**/*.{js,ts}",
      "src/hooks/**/*.{js,ts,tsx}",
      "src/loaders/**/*.{js,ts,tsx}",
      "src/constants/**/*.{js,ts,tsx}",
      "src/features/**/hooks/**/*.{js,ts,tsx}",
      "src/features/**/types/**/*.{js,ts,tsx}",
      "src/features/**/utils/**/*.{js,ts,tsx}",
      "src/features/**/constants/**/*.{js,ts,tsx}",
      "src/appRouter.tsx",
    ],
    rules: {
      "unicorn/filename-case": [
        "error",
        {
          case: "camelCase",
          multipleFileExtensions: false,
        },
      ],
    },
  },
  // Main config for all files
  {
    files: ["src/**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    languageOptions: {
      globals: globals.browser,
      parser: tseslint.parser,
      parserOptions: {
        sourceType: "module",
        ecmaVersion: "latest",
        project: ["./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      react: pluginReact,
      "react-hooks": pluginReactHooks,
      "jsx-a11y": pluginJsxA11y,
      unicorn: eslintPluginUnicorn,
      prettier: eslintPluginPrettier,
      "simple-import-sort": simpleImportSort,
      import: eslintPluginImport,
      ...pluginRouter.configs["flat/recommended"],
    },
    rules: {
      ...pluginJs.configs.recommended.rules,
      ...tseslint.configs.recommendedTypeChecked.rules,
      ...pluginReact.configs.recommended.rules,
      ...pluginReactHooks.configs.recommended.rules,
      ...pluginJsxA11y.configs.recommended.rules,
      ...eslintPluginUnicorn.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "import/first": "error",
      "import/newline-after-import": "error",
      "import/no-duplicates": "error",
      "unicorn/better-regex": "warn",
      "react/no-unescaped-entities": "off",
      // Remove unicorn/filename-case here, handled by overrides above
      "unicorn/prevent-abbreviations": [
        "error",
        {
          allowList: { Props: true },
        },
      ],
      "prettier/prettier": ["error"],
      // Disable unused vars globally
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      // Disable no-undef globally (React/TSX compatibility)
      "no-undef": "off",
    },
    settings: {
      react: { version: "detect" },
      "import/resolver": {
        typescript: {
          project: ["./tsconfig.app.json", "./tsconfig.node.json"],
          noWarnOnMultipleProjects: true,
        },
      },
    },
  },
  // Prettier config disables conflicting rules (must be last in array)
  prettierConfig,
];
