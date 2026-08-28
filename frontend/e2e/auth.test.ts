import { setupClerkTestingToken } from '@clerk/testing/playwright'
import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { navigateToSignUp, navigateToSignIn, loginWithTestUser, signUpViaUI } from './helpers/auth'
import { generateRandomEmail, generateRandomPassword } from './helpers'

test.describe('Authentication E2E Tests', () => {
  test.describe('Sign Up Flow', () => {
    test('should load sign up page', async ({ page }: { page: Page }) => {
      await navigateToSignUp(page)
      const url = page.url()
      expect(url.includes('register')).toBe(true)
    })

    test('should show registration form', async ({ page }: { page: Page }) => {
      await navigateToSignUp(page)
      const hasForm = await page.locator('input').count()
      expect(hasForm).toBeGreaterThan(0)
    })

    test('should have email input field', async ({ page }: { page: Page }) => {
      await navigateToSignUp(page)
      const emailInput = page.locator('input[type="email"], input[name="email"]').first()
      await expect(emailInput).toBeVisible()
    })
  })

  test.describe('Sign In Flow', () => {
    test('should load sign in page', async ({ page }: { page: Page }) => {
      await navigateToSignIn(page)
      const url = page.url()
      expect(url.includes('login')).toBe(true)
    })

    test('should show login form', async ({ page }: { page: Page }) => {
      await navigateToSignIn(page)
      const hasForm = await page.locator('input').count()
      expect(hasForm).toBeGreaterThan(0)
    })

    test('should have email and password fields', async ({ page }: { page: Page }) => {
      await navigateToSignIn(page)
      const emailInput = page.locator('input[type="email"], input[name="email"]').first()
      await expect(emailInput).toBeVisible()

      // The password field is revealed once there is an email to go with it.
      await emailInput.fill('someone@example.com')
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first()
      await expect(passwordInput).toBeVisible()
    })
  })

  test.describe('User Registration', () => {
    test('should complete registration flow', async ({ page }: { page: Page }) => {
      test.setTimeout(60000)

      // The dev instance has bot protection on, which blocks a headless
      // sign-up outright. Without this the flow never reaches the code screen.
      await setupClerkTestingToken({ page })

      const email = generateRandomEmail()
      // A fixed password fails HIBP on the dev instance (form_password_pwned).
      const password = generateRandomPassword()

      await signUpViaUI(page, email, password)

      // "still on /register" used to count as success here, so this passed
      // while the account was never created. Landing on profile setup or the
      // app is the only outcome that means the sign-up actually completed.
      // /auth-ready is a staging post: it exchanges the Clerk token and syncs
      // the account before routing on, so give it room.
      await expect(page).toHaveURL(/\/profile-setup|\/home|\/dashboard/, {
        timeout: 30000,
      })
    })
  })

  test.describe('User Login', () => {
    test('should login with existing user', async ({ page }: { page: Page }) => {
      test.setTimeout(30000)

      // Skip if no test credentials
      if (!process.env.E2E_CLERK_USER_EMAIL || !process.env.E2E_CLERK_USER_PASSWORD) {
        test.skip()
      }

      await setupClerkTestingToken({ page })
      await loginWithTestUser(page)

      // Verify we're on an authenticated page
      const url = page.url()
      expect(url.includes('/home') || url.includes('/dashboard')).toBe(true)
    })
  })

  test.describe('Landing Page Auth', () => {
    test('should have sign up button on landing page', async ({ page }: { page: Page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      const signUpButton = page.locator('a[href*="register"], button:has-text("Sign up"), button:has-text("Get started")').first()
      await expect(signUpButton).toBeVisible()
    })

    test('should have sign in button on landing page', async ({ page }: { page: Page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      const signInButton = page.locator('a[href*="login"], button:has-text("Sign in"), button:has-text("Log in")').first()
      await expect(signInButton).toBeVisible()
    })
  })
})
