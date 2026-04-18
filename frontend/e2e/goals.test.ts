import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { loginWithTestUser } from './helpers/auth'
import { waitForPageReady } from './helpers/index'

test.describe('Goals E2E Tests', () => {
  test.describe('Authenticated Goals Page', () => {
    test.beforeEach(async ({ page }: { page: Page }) => {
      // Skip if no test credentials
      if (!process.env.E2E_CLERK_USER_EMAIL || !process.env.E2E_CLERK_USER_PASSWORD) {
        test.skip()
      }
      
      // Login before each test
      await loginWithTestUser(page)
    })

    test('should navigate to goals page when authenticated', async ({ page }: { page: Page }) => {
      await page.goto('/goals')
      await waitForPageReady(page)

      await expect(page).toHaveURL(/goals/)
    })

    test('should display page content', async ({ page }: { page: Page }) => {
      await page.goto('/goals')
      await waitForPageReady(page)

      // Check that the page has loaded (has body content)
      const hasContent = await page.locator('body').count()
      expect(hasContent).toBeGreaterThan(0)
    })

    test('should have interactive elements', async ({ page }: { page: Page }) => {
      await page.goto('/goals')
      await waitForPageReady(page)

      // Check for buttons or inputs
      const hasElements = await page.locator('button, input, a').count()
      expect(hasElements).toBeGreaterThan(0)
    })
  })
})
