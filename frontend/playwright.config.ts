import { defineConfig, devices } from '@playwright/test'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load test environment variables - MUST be done before any other code
dotenv.config({ path: resolve(__dirname, '.env.test') })

// Ensure required env vars are set for Clerk testing
if (!process.env.CLERK_PUBLISHABLE_KEY) {
  console.warn('Warning: CLERK_PUBLISHABLE_KEY is not set')
}

const PORT = process.env.PORT || 5173
const baseURL = process.env.FRONTEND_URL || `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  outputDir: 'test-results/',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',

  // Must be the config option, not a setup project. As a project, Playwright
  // looks for test() calls in the file and never invokes its default export,
  // so clerkSetup() did not run and setupClerkTestingToken had no Frontend API
  // URL to work with. globalSetup also runs before workers fork, which is what
  // lets the env it sets reach them.
  globalSetup: './e2e/global.setup.ts',
  
  // Both halves have to run in Clerk mode or the suite tests the wrong app.
  // AUTH_MODE is unset in .env.development, so the default ("local") renders
  // LocalSignUpForm and the backend rejects Clerk tokens with a 401. Every
  // Clerk auth path went untested that way, which is how a production-only
  // sign-up break reached users.
  webServer: [
    {
      command: 'bun run dev',
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      env: { VITE_AUTH_MODE: 'clerk' },
    },
    {
      command: 'bun run dev',
      cwd: resolve(__dirname, '..', 'backend'),
      url: process.env.BACKEND_URL || 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      env: {
        AUTH_MODE: 'clerk',
        APP_MODE: 'managed',
        BILLING_MODE: 'managed',
      },
    },
  ],

  use: {
    baseURL,
    trace: 'retry-with-trace',
  },
  
  projects: [
    {
      name: 'tests',
      testMatch: /.*\.test\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
})
