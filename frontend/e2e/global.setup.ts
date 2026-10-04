import { chromium } from '@playwright/test'
import { clerk, clerkSetup } from '@clerk/testing/playwright'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import dotenv from 'dotenv'
import { BACKEND_URL, FRONTEND_URL } from './helpers'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load test environment variables
dotenv.config({ path: resolve(__dirname, '..', '.env.test') })

// Debug: Log env var status
console.log('Global Setup - CLERK_PUBLISHABLE_KEY:', process.env.CLERK_PUBLISHABLE_KEY ? 'Set' : 'Not set')

async function callBackend(path: string, token: string, body: object = {}): Promise<void> {
  const response = await fetch(`${BACKEND_URL}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}: ${await response.text()}`)
  }
}

/**
 * The backend starts on an empty database, and sign-in only reaches /home for
 * an account with a finished profile. Link the e2e user and fill its profile
 * through the API so the signed-in specs start in the app, not onboarding.
 * The token comes from a browser sign-in because the backend only accepts
 * tokens whose azp claim is the app's origin.
 */
async function prepareTestUser(): Promise<void> {
  const email = process.env.E2E_CLERK_USER_EMAIL
  if (!email) {
    return
  }

  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    await page.goto(`${FRONTEND_URL}/login`)
    await clerk.signIn({ page, emailAddress: email })
    const token = await page.evaluate(() =>
      (window as unknown as { Clerk: { session: { getToken: () => Promise<string> } } }).Clerk.session.getToken(),
    )

    await callBackend('/api/auth/clerk-sync', token)
    await callBackend('/api/user/complete-profile', token, {
      dateOfBirth: '1990-01-01',
      height: 180,
      weight: 80,
      gender: 'male',
      activityLevel: 3,
      unitSystem: 'metric',
    })
  } finally {
    await browser.close()
  }
}

async function globalSetup() {
  // This sets up the Clerk testing token
  // It requires CLERK_SECRET_KEY to be set in environment
  await clerkSetup()
  console.log('Clerk setup completed')
  await prepareTestUser()
}

export default globalSetup
