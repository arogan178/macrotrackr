import pluginJs from "@eslint/js";
import eslintPluginImport from "eslint-plugin-import";
import pluginJsxA11y from "eslint-plugin-jsx-a11y";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import eslintPluginUnicorn from "eslint-plugin-unicorn";
// Removed eslint-plugin-prettier; we use eslint-config-prettier only
import globals from "globals";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";
import pluginRouter from "@tanstack/eslint-plugin-router";
import tailwindPlugin from "eslint-plugin-tailwindcss";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Tailwind v4 root CSS detected at frontend/src/style.css
const TAILWIND_ROOT_CSS = resolve(__dirname, "src/style.css");

// Helper to safely extract rules from TanStack Router flat config that may be an array or object
function getTanStackRouterRules() {
  const preset = pluginRouter.configs["flat/recommended"];
  if (Array.isArray(preset)) {
    return preset[0]?.rules ?? {};
  }
  return preset?.rules ?? {};
}

export default [
  // Global ignores for auto-generated artifacts
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

  // PascalCase for components (include top-level AppRouter)
  {
    files: [
      "src/components/**/*.{js,jsx,ts,tsx}",
      "src/pages/**/*.{js,jsx,ts,tsx}",
      "src/AppRouter.tsx",
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

  // camelCase for utils, types, store, hooks, and lib
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

  // TanStack Router rules applied explicitly to avoid numeric-key flat config issues
  {
    files: ["src/**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    plugins: {
      "@tanstack/router": pluginRouter,
    },
    rules: {
      ...getTanStackRouterRules(),
    },
  },

  // Main config for all files
  {
    files: ["src/**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    // Ensure we ignore TanStack Router's auto-generated file(s)
    ignores: [
      "src/routeTree.gen.ts",
      "src/routeTree.gen.*",
      "src/routes/__root.gen.*",
    ],
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
      ...pluginJs.configs.recommended.rules,
      ...tseslint.configs.recommendedTypeChecked.rules,
      ...tseslint.configs.stylisticTypeChecked.rules,
      ...pluginReact.configs.recommended.rules,
      ...pluginReactHooks.configs.recommended.rules,
      ...pluginJsxA11y.configs.recommended.rules,
      ...eslintPluginUnicorn.configs.recommended.rules,

      // Tailwind CSS plugin: key best practices
      "tailwindcss/classnames-order": "warn",
      "tailwindcss/no-custom-classname": "off", // Allow design-system classnames
      "tailwindcss/no-contradicting-classname": "error",

      "react/react-in-jsx-scope": "off",

      // Import hygiene and sorted groups
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            // Side effect imports
            ["^\\u0000"],
            // Node.js builtins
            ["^node:"],
            // External packages
            ["^react", "^@?\\w"],
            // Internal aliases
            ["^@/"],
            // Parent imports
            ["^\\.\\.(?!/?$)", "^\\.\\./?$"],
            // Same-folder imports
            ["^\\./(?=.*/)(?!/?$)", "^\\.(?!/?$)", "^\\./?$"],
            // Style imports
            ["^.+\\.s?css$"],
          ],
        },
      ],
      "simple-import-sort/exports": "error",
      "import/first": "error",
      "import/newline-after-import": "error",
      "import/no-duplicates": "error",
      "import/no-cycle": ["error", { maxDepth: 3 }],
      "import/no-self-import": "error",
      "import/no-useless-path-segments": ["error", { noUselessIndex: true }],

      "unicorn/better-regex": "warn",
      "unicorn/no-null": "off",
      "react/no-unescaped-entities": "off",

      // Remove unicorn/filename-case here, handled by overrides above
      "unicorn/prevent-abbreviations": [
        "error",
        {
          allowList: { Props: true },
        },
      ],

      // Core rule disabled in favor of TS rule
      "no-unused-vars": "off",

      // Enabled per user preference with tuned config (warn)
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],

      // Disable no-undef globally (React/TSX compatibility)
      "no-undef": "off",
      // Allow explicit use of undefined (sometimes needed for TS overloads / API semantics)
      "no-undefined": "off",
      // Permit intentional undefined usages without auto-fix noise
      "unicorn/no-useless-undefined": "off",

      // Warn on explicit any usage to prevent type regression
      "@typescript-eslint/no-explicit-any": "warn",

      // Warn on type assertions that could be unsafe
      "@typescript-eslint/consistent-type-assertions": [
        "warn",
        {
          assertionStyle: "as",
          objectLiteralTypeAssertions: "never",
        },
      ],

      // Best practices - prefer const and immutable patterns
      "prefer-const": "error",
      "no-var": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      
      // Prevent common mistakes
      "no-shadow": "off",
      "@typescript-eslint/no-shadow": "error",
      "@typescript-eslint/prefer-nullish-coalescing": "warn",
      "@typescript-eslint/prefer-optional-chain": "warn",
      "@typescript-eslint/no-unnecessary-condition": "warn",
      "@typescript-eslint/strict-boolean-expressions": "off",

      // Naming conventions
      "@typescript-eslint/naming-convention": [
        "warn",
        {
          selector: "variable",
          format: ["camelCase", "UPPER_CASE", "PascalCase"],
          leadingUnderscore: "allow",
        },
        {
          selector: "function",
          format: ["camelCase", "PascalCase"],
        },
        {
          selector: "typeLike",
          format: ["PascalCase"],
        },
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
      // Tailwind v4 workaround for eslint-plugin-tailwindcss 4.0.0-beta.0:
      // point to the absolute path of the root Tailwind CSS file.
      tailwindcss: {
        config: TAILWIND_ROOT_CSS,
        callees: ["cn", "clsx", "classnames"],
        removeDuplicates: true,
      },
    },
  },

  // Tests override: disable typed linting and prop-types in TS tests
  {
    files: ["src/**/*.test.{ts,tsx}", "src/**/__tests__/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: null,
      },
    },
    rules: {
      "react/prop-types": "off",
      // Allow any in test files for mocking purposes
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/consistent-type-assertions": "off",
      // Disable type-checked rules in tests
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      "@typescript-eslint/prefer-optional-chain": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/no-shadow": "off",
      "no-shadow": "off",
    },
  },

  // Prettier config disables conflicting rules (must be last in array)
  prettierConfig,
];
