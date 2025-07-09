import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import jsxA11y from "eslint-plugin-jsx-a11y";
import tseslint from "typescript-eslint";
import { FlatCompat } from "@eslint/eslintrc";
import stylistic from '@stylistic/eslint-plugin';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname || process.cwd(),
});

const reactCompat = compat.extends("plugin:react/recommended");
const jsxA11yCompat = compat.extends("plugin:jsx-a11y/recommended");
import importPlugin from "eslint-plugin-import";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      ...reactCompat,
      ...jsxA11yCompat,
    ],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "jsx-a11y": jsxA11y,
      import: importPlugin,
      '@stylistic': stylistic,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "import/no-duplicates": "error",
      // React and accessibility essentials
      "react/jsx-uses-react": "off", // Not needed with React 17+
      "react/react-in-jsx-scope": "off", // Not needed with React 17+
      "jsx-a11y/anchor-is-valid": "warn",
      "jsx-a11y/alt-text": "warn",
      "jsx-a11y/no-autofocus": "warn",
      '@stylistic/indent': ['error', 2],
      '@stylistic/semi': ['error', 'always'],
      '@stylistic/quotes': ['error', 'double'],
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  }
);
