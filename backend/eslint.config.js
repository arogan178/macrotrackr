import pluginJs from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default [
  // Global ignores
  {
    ignores: ["dist", "node_modules", "coverage"],
  },

  // Main config for src TypeScript files (with type checking)
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parser: tseslint.parser,
      parserOptions: {
        sourceType: "module",
        ecmaVersion: "latest",
        project: ["./tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      ...pluginJs.configs.recommended.rules,
      ...tseslint.configs.recommendedTypeChecked.rules,
      ...tseslint.configs.stylisticTypeChecked.rules,

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

      // Core rule disabled in favor of TS rule
      "no-unused-vars": "off",

      // TypeScript unused vars with underscore exception
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],

      // Allow explicit use of undefined
      "no-undefined": "off",
    },
  },

  // Scripts config (without type checking - not in tsconfig)
  {
    files: ["scripts/**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parser: tseslint.parser,
      parserOptions: {
        sourceType: "module",
        ecmaVersion: "latest",
        project: null,
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      ...pluginJs.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,

      // Warn on explicit any usage to prevent type regression
      "@typescript-eslint/no-explicit-any": "warn",

      // Core rule disabled in favor of TS rule
      "no-unused-vars": "off",

      // TypeScript unused vars with underscore exception
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },

  // Tests override: disable typed linting and allow any for mocking
  {
    files: ["tests/**/*.ts", "**/*.test.ts", "**/__tests__/**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: null,
      },
    },
    rules: {
      // Allow any in test files for mocking purposes
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/consistent-type-assertions": "off",
      // Disable type-checked rules in tests
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
    },
  },
];
