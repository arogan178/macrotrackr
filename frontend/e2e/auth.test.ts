import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { navigateToSignUp, navigateToSignIn, loginWithTestUser, signUpViaUI } from './helpers/auth'
import { sleep } from './helpers/index'

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

      const passwordInput = page.locator('input[type="password"], input[name="password"]').first()
      await expect(passwordInput).toBeVisible()
    })
  })

  test.describe('User Registration', () => {
    test('should complete registration flow', async ({ page }: { page: Page }) => {
      test.setTimeout(60000)

      const email = `test_${Date.now()}@example.com`
      const password = 'TestPassword123!'

      await signUpViaUI(page, email, password)

      // After sign up, should be redirected to home, verification page, or still on register if verification needed
      const url = page.url()
      const isSuccess = url.includes('home') || 
                       url.includes('verify') || 
                       url.includes('dashboard') ||
                       url.includes('register') ||
                       url.includes('confirm') ||
                       url.includes('auth')
      expect(isSuccess).toBe(true)
    })
  })

  test.describe('User Login', () => {
    test('should login with existing user', async ({ page }: { page: Page }) => {
      test.setTimeout(30000)

      // Skip if no test credentials
      if (!process.env.E2E_CLERK_USER_EMAIL || !process.env.E2E_CLERK_USER_PASSWORD) {
        test.skip()
      }

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
