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
  
  webServer: {
    command: 'bun run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  use: {
    baseURL,
    trace: 'retry-with-trace',
  },
  
  projects: [
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
    },
    {
      name: 'tests',
      testMatch: /.*\.test\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
      dependencies: ['setup'],
    },
  ],
})
