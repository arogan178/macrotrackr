import { createRequire } from 'node:module'
import path from 'node:path'

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

const { version } = createRequire(import.meta.url)('./package.json')

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  // Explicit, so the alias does not depend on test files being members of
  // tsconfig.app.json. Excluding them there (which is correct: they need vitest
  // globals the app build must not have) previously broke every `@/` import at
  // run time, because tsconfigPaths stops aliasing files outside the project.
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@shared': path.resolve(import.meta.dirname, '../shared'),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'dist'],
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'src/**/*.test.{ts,tsx}',
        '*.config.ts',
      ],
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
})
