import { fileURLToPath } from "node:url";
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      "@shared": fileURLToPath(new URL("../shared", import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'tests/**',
        '*.config.ts',
      ],
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
})
