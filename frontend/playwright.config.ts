import { defineConfig, devices } from '@playwright/test'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import dotenv from 'dotenv'
import { BACKEND_PORT, BACKEND_URL, FRONTEND_PORT, FRONTEND_URL } from './e2e/helpers'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load test environment variables - MUST be done before any other code
dotenv.config({ path: resolve(__dirname, '.env.test') })

// Ensure required env vars are set for Clerk testing
if (!process.env.CLERK_PUBLISHABLE_KEY) {
  console.warn('Warning: CLERK_PUBLISHABLE_KEY is not set')
}

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
  //
  // Never reuse a running server: it would bring its own database and auth
  // mode. The backend starts on an empty in-memory database every run, and
  // global setup creates the data the tests need.
  webServer: [
    {
      command: `bun run dev --port ${FRONTEND_PORT} --strictPort`,
      url: FRONTEND_URL,
      reuseExistingServer: false,
      timeout: 120 * 1000,
      env: { VITE_AUTH_MODE: 'clerk', VITE_API_URL: BACKEND_URL },
    },
    {
      // --no-env-file keeps backend/.env.development (live keys, dev
      // database) out of the run. Stripe is never called by these tests.
      command: 'bun --no-env-file src/index.ts',
      cwd: resolve(__dirname, '..', 'backend'),
      url: `${BACKEND_URL}/api/health`,
      reuseExistingServer: false,
      timeout: 120 * 1000,
      env: {
        AUTH_MODE: 'clerk',
        APP_MODE: 'managed',
        BILLING_MODE: 'managed',
        PORT: BACKEND_PORT,
        DATABASE_PATH: ':memory:',
        APP_URL: FRONTEND_URL,
        CORS_ORIGIN: FRONTEND_URL,
        STRIPE_SECRET_KEY: 'sk_test_e2e',
        STRIPE_WEBHOOK_SECRET: 'whsec_e2e',
        STRIPE_PRICE_ID_MONTHLY: 'price_e2e_monthly',
        STRIPE_PRICE_ID_YEARLY: 'price_e2e_yearly',
      },
    },
  ],

  use: {
    baseURL: FRONTEND_URL,
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
