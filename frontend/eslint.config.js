import pluginJs from "@eslint/js";
import eslintPluginImport from "eslint-plugin-import";
import pluginJsxA11y from "eslint-plugin-jsx-a11y";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import eslintPluginUnicorn from "eslint-plugin-unicorn";
import globals from "globals";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";
import pluginRouter from "@tanstack/eslint-plugin-router";
import tailwindPlugin from "eslint-plugin-tailwindcss";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TAILWIND_ROOT_CSS = resolve(__dirname, "src/style.css");

function getTanStackRouterRules() {
  const preset = pluginRouter.configs["flat/recommended"];
  if (Array.isArray(preset)) {
    return preset[0]?.rules ?? {};
  }
  return preset?.rules ?? {};
}

export default [
  // Global ignores
  {
    name: "global-ignores",
    ignores: [
      "dist",
      "build",
      "coverage",
      ".vite",
      "node_modules",
      "src/routeTree.gen.ts",
      "src/routeTree.gen.*",
    ],
  },

  // PascalCase for components and pages
  {
    files: [
      "src/components/**/*.{js,jsx,ts,tsx}",
      "src/pages/**/*.{js,jsx,ts,tsx}",
      "src/AppRouter.tsx",
      "src/features/**/components/**/*.{js,jsx,ts,tsx}",
      "src/features/**/pages/**/*.{js,jsx,ts,tsx}",
    ],
    rules: {
      "unicorn/filename-case": ["error", { case: "pascalCase", multipleFileExtensions: false }],
    },
  },

  // camelCase for utils, types, hooks, lib
  {
    files: [
      "src/utils/**/*.{js,ts,tsx}",
      "src/types/**/*.{js,ts,tsx}",
      "src/hooks/**/*.{js,ts,tsx}",
      "src/loaders/**/*.{js,ts,tsx}",
      "src/constants/**/*.{js,ts,tsx}",
      "src/lib/**/*.{js,ts,tsx}",
      "src/theme/**/*.{js,ts,tsx}",
      "src/features/**/hooks/**/*.{js,ts,tsx}",
      "src/features/**/types/**/*.{js,ts,tsx}",
      "src/features/**/utils/**/*.{js,ts,tsx}",
      "src/features/**/constants/**/*.{js,ts,tsx}",
      "src/api/**/*.{js,ts,tsx}",
      "src/routes/**/*.{js,ts,tsx}",
    ],
    rules: {
      "unicorn/filename-case": ["error", { case: "camelCase", multipleFileExtensions: false }],
    },
  },

  // TanStack Router rules
  {
    files: ["src/**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    plugins: { "@tanstack/router": pluginRouter },
    rules: { ...getTanStackRouterRules() },
  },

  // Main config
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
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      react: pluginReact,
      "react-hooks": pluginReactHooks,
      "jsx-a11y": pluginJsxA11y,
      unicorn: eslintPluginUnicorn,
      "simple-import-sort": simpleImportSort,
      import: eslintPluginImport,
      tailwindcss: tailwindPlugin,
    },
    rules: {
      // Base rules
      ...pluginJs.configs.recommended.rules,
      ...tseslint.configs.recommendedTypeChecked.rules,
      ...tseslint.configs.stylisticTypeChecked.rules,
      ...pluginReact.configs.recommended.rules,
      ...pluginReactHooks.configs.recommended.rules,
      ...pluginJsxA11y.configs.recommended.rules,

      // Tailwind
      "tailwindcss/classnames-order": "warn",
      "tailwindcss/no-custom-classname": "off",
      "tailwindcss/no-contradicting-classname": "error",

      // React
      "react/react-in-jsx-scope": "off",
      "react/no-unescaped-entities": "off",

      // Import organization
      "simple-import-sort/imports": ["error", {
        groups: [
          ["^\\u0000"],
          ["^node:"],
          ["^react", "^@?\\w"],
          ["^@/"],
          ["^\\.\\.(?!/?$)", "^\\.\\./?$"],
          ["^\\./(?=.*/)(?!/?$)", "^\\.(?!/?$)", "^\\./?$"],
          ["^.+\\.s?css$"],
        ],
      }],
      "simple-import-sort/exports": "error",
      "import/first": "error",
      "import/newline-after-import": "error",
      "import/no-duplicates": "error",
      "import/no-cycle": ["error", { maxDepth: 3 }],
      "import/no-self-import": "error",
      "import/no-useless-path-segments": ["error", { noUselessIndex: true }],

      // Unicorn - selective
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
        },
      }],
      "unicorn/no-array-reduce": "off",
      "unicorn/no-nested-ternary": "off",

      // TypeScript
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        ignoreRestSiblings: true,
      }],
      "no-undef": "off",
      "no-undefined": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/consistent-type-assertions": ["warn", {
        assertionStyle: "as",
        objectLiteralTypeAssertions: "never",
      }],

      // Best practices
      "prefer-const": "error",
      "no-var": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      
      // Type safety - warnings only
      "no-shadow": "off",
      "@typescript-eslint/no-shadow": "warn",
      "@typescript-eslint/prefer-nullish-coalescing": "warn",
      "@typescript-eslint/prefer-optional-chain": "warn",
      "@typescript-eslint/no-unnecessary-condition": "warn",
      "@typescript-eslint/strict-boolean-expressions": "off",

      // Naming
      "@typescript-eslint/naming-convention": [
        "warn",
        { selector: "variable", format: ["camelCase", "UPPER_CASE", "PascalCase"], leadingUnderscore: "allow" },
        { selector: "function", format: ["camelCase", "PascalCase"] },
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
      tailwindcss: {
        config: TAILWIND_ROOT_CSS,
        callees: ["cn", "clsx", "classnames"],
        removeDuplicates: true,
      },
    },
  },

  // Tests override - relaxed rules
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
      "no-shadow": "off",
      "unicorn/filename-case": "off",
      "no-constant-binary-expression": "off",
    },
  },

  // Prettier - must be last
  prettierConfig,
];
