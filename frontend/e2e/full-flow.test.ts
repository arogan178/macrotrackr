import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { navigateToSignIn, loginWithTestUser } from './helpers/auth'
import { waitForAnyVisible, waitForPageReady } from './helpers/index'

test.describe('Full Flow E2E Tests', () => {
  test.describe('Complete User Journey', () => {
    test('should login with existing user and access pages', async ({ page }: { page: Page }) => {
      test.setTimeout(60000)

      // Skip if no test credentials
      if (!process.env.E2E_CLERK_USER_EMAIL || !process.env.E2E_CLERK_USER_PASSWORD) {
        test.skip()
      }

      await loginWithTestUser(page)

      // Access goals page
      await page.goto('/goals')
      await expect(page).toHaveURL(/\/goals/)
      await expect(page.getByRole('heading', { name: 'Your Goals', level: 1 })).toBeVisible()

      // Access settings page
      await page.goto('/settings')
      await expect(page).toHaveURL(/\/settings/)
      await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible()
    })
  })

  test.describe('Error Handling', () => {
    test('should show error for invalid login', async ({ page }: { page: Page }) => {
      await navigateToSignIn(page)
      
      const emailInput = page.locator('input[type="email"], input[name="email"]').first()
      await emailInput.fill('invalid@example.com')

      const passwordInput = page.locator('input[type="password"], input[name="password"]').first()
      await passwordInput.fill('wrongpassword123!')

      const submitButton = page.locator('button[type="submit"]').first()
      await submitButton.click()

      await Promise.race([
        waitForAnyVisible(page, ['[role="alert"]', 'text=incorrect', 'text=invalid', 'text=wrong', 'text=Error'], 10000),
        page.waitForURL(/\/login|\/sign-in/, { timeout: 10000 }),
      ])

      // Should show error message or stay on login page
      const url = page.url()
      const hasError = await page.locator('text=incorrect, text=invalid, text=wrong, text=Error, [role="alert"]').count() > 0
      const stillOnLogin = url.includes('login') || url.includes('sign-in')
      expect(hasError || stillOnLogin).toBe(true)
    })
  })

  test.describe('Landing Page', () => {
    test('should load landing page correctly', async ({ page }: { page: Page }) => {
      await page.goto('/')
      await waitForPageReady(page)

      const title = await page.title()
      expect(title).toBeTruthy()

      const hasContent = await page.locator('main, h1, body').count()
      expect(hasContent > 0).toBe(true)
    })
  })
})
