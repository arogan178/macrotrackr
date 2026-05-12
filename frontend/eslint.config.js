import pluginJs from "@eslint/js";
import stylisticPlugin from "@stylistic/eslint-plugin";
import eslintPluginImport from "eslint-plugin-import";
import pluginJsxA11y from "eslint-plugin-jsx-a11y";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginReactRefresh from "eslint-plugin-react-refresh";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import eslintPluginUnicorn from "eslint-plugin-unicorn";
import globals from "globals";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";

export default [
  {
    name: "global-ignores",
    ignores: ["dist", "build", "coverage", ".vite", "node_modules", "src/routeTree.gen.ts", "src/routeTree.gen.*"],
  },
  {
    files: ["src/components/**/*.{js,jsx,ts,tsx}", "src/pages/**/*.{js,jsx,ts,tsx}", "src/AppRouter.tsx", "src/features/**/components/**/*.{js,jsx,ts,tsx}", "src/features/**/pages/**/*.{js,jsx,ts,tsx}"],
    rules: {
      "unicorn/filename-case": ["error", { case: "pascalCase", multipleFileExtensions: false }],
    },
  },
  {
    files: ["src/utils/**/*.{js,ts,tsx}", "src/types/**/*.{js,ts,tsx}", "src/hooks/**/*.{js,ts,tsx}", "src/loaders/**/*.{js,ts,tsx}", "src/constants/**/*.{js,ts,tsx}", "src/lib/**/*.{js,ts,tsx}", "src/theme/**/*.{js,ts,tsx}", "src/features/**/hooks/**/*.{js,ts,tsx}", "src/features/**/types/**/*.{js,ts,tsx}", "src/features/**/utils/**/*.{js,ts,tsx}", "src/features/**/constants/**/*.{js,ts,tsx}", "src/api/**/*.{js,ts,tsx}"],
    rules: {
      "unicorn/filename-case": ["error", { case: "camelCase", multipleFileExtensions: false }],
    },
  },
  {
    files: ["src/routes/**/*.{js,ts,tsx}"],
    rules: {
      "unicorn/filename-case": "off",
    },
  },
  {
    files: ["src/**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    ignores: ["src/routeTree.gen.ts", "src/routeTree.gen.*", "src/routes/__root.gen.*"],
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
    linterOptions: { reportUnusedDisableDirectives: true },
    plugins: {
      "@stylistic": stylisticPlugin,
      "@typescript-eslint": tseslint.plugin,
      react: pluginReact,
      "react-hooks": pluginReactHooks,
      "react-refresh": pluginReactRefresh,
      "jsx-a11y": pluginJsxA11y,
      unicorn: eslintPluginUnicorn,
      "simple-import-sort": simpleImportSort,
      import: eslintPluginImport,
    },
    rules: {
      ...pluginJs.configs.recommended.rules,
      ...tseslint.configs.recommendedTypeChecked.rules,
      ...tseslint.configs.stylisticTypeChecked.rules,
      ...pluginReact.configs.recommended.rules,
      ...pluginReactHooks.configs.recommended.rules,
      ...pluginJsxA11y.configs.recommended.rules,
      "react-refresh/only-export-components": "off",
      "@stylistic/padding-line-between-statements": ["warn", { blankLine: "always", prev: "*", next: "return" }],
      "react/react-in-jsx-scope": "off",
      "react/no-unescaped-entities": "off",
      "react/self-closing-comp": "error",
      "react/prop-types": "off",
      "react/jsx-no-useless-fragment": "warn",
      "react/jsx-boolean-value": ["error", "never"],
      "react/no-array-index-key": "off",
      "simple-import-sort/imports": ["error", {
        groups: [["^\\u0000"], ["^node:"], ["^react", "^@?\\w"], ["^@/"], ["^\\.\\.(?!/?$)", "^\\.\\./?$"], ["^\\./(?=.*/)(?!/?$)", "^\\.(?!/?$)", "^\\./?$"], ["^.+\\.s?css$"]],
      }],
      "simple-import-sort/exports": "error",
      "import/first": "error",
      "import/newline-after-import": "error",
      "import/no-duplicates": "error",
      "import/no-cycle": ["error", { maxDepth: 3 }],
      "import/no-self-import": "error",
      "import/no-useless-path-segments": ["error", { noUselessIndex: true }],
      "import/no-mutable-exports": "error",
      "unicorn/better-regex": "warn",
      "unicorn/no-null": "off",
      "unicorn/no-useless-undefined": "off",
      "unicorn/prevent-abbreviations": ["warn", {
        allowList: {
          Props: true, Ref: true, params: true, args: true, fn: true,
          acc: true, val: true, prev: true, curr: true, idx: true,
          res: true, req: true, err: true, env: true, doc: true,
          el: true, btn: true, src: true, dest: true, str: true,
          num: true, len: true, max: true, min: true, arg: true,
          db: true, api: true, url: true, uri: true, id: true,
        },
      }],
      "unicorn/no-array-reduce": "off",
      "unicorn/no-nested-ternary": "off",
      "unicorn/no-process-exit": "off",
      "unicorn/prefer-module": "off",
      "unicorn/prefer-node-protocol": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        ignoreRestSiblings: true,
        caughtErrorsIgnorePattern: "^_",
      }],
      "no-undef": "off",
      "no-undefined": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/consistent-type-assertions": ["warn", {
        assertionStyle: "as",
        objectLiteralTypeAssertions: "never",
      }],
      "@typescript-eslint/consistent-type-definitions": ["warn", "interface"],
      "@typescript-eslint/no-inferrable-types": "warn",
      "prefer-const": "error",
      "no-var": "error",
      "no-console": ["warn", { allow: ["debug", "info", "warn", "error"] }],
      "no-debugger": "warn",
      "no-alert": "warn",
      "no-duplicate-imports": "error",
      "no-shadow": "off",
      "@typescript-eslint/no-shadow": "warn",
      "@typescript-eslint/prefer-nullish-coalescing": "warn",
      "@typescript-eslint/prefer-optional-chain": "warn",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/strict-boolean-expressions": "off",
      // Not appropriate for React frontend - async event handlers are common
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-misused-promises": "off",
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/naming-convention": [
        "warn",
        { selector: "variable", format: ["camelCase", "UPPER_CASE", "PascalCase"], leadingUnderscore: "allow" },
        { selector: "function", format: ["camelCase", "PascalCase"] },
        { selector: "typeParameter", format: ["PascalCase"], leadingUnderscore: "allow" },
        { selector: "variable", modifiers: ["global"], filter: { regex: "^__WB_MANIFEST$", match: true }, format: null },
        { selector: "typeLike", format: ["PascalCase"] },
      ],
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
  {
    files: ["src/**/*.test.{ts,tsx}", "src/**/__tests__/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { project: null },
    },
    rules: {
      "react/prop-types": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/consistent-type-assertions": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      "@typescript-eslint/prefer-optional-chain": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/no-shadow": "off",
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-misused-promises": "off",
      "@typescript-eslint/require-await": "off",
      "no-shadow": "off",
      "unicorn/filename-case": "off",
      "no-constant-binary-expression": "off",
    },
  },
  prettierConfig,
];
