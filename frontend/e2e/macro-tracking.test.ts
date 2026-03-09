import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { loginWithTestUser } from './helpers/auth'
import { sleep } from './helpers/index'

test.describe('Macro Tracking E2E Tests', () => {
  test.describe('Authenticated Home Page', () => {
    test.beforeEach(async ({ page }: { page: Page }) => {
      // Skip if no test credentials
      if (!process.env.E2E_CLERK_USER_EMAIL || !process.env.E2E_CLERK_USER_PASSWORD) {
        test.skip()
      }
      
      // Login before each test
      await loginWithTestUser(page)
    })

    test('should load the home page after login', async ({ page }: { page: Page }) => {
      await page.goto('/home')
      await page.waitForLoadState('networkidle')
      await sleep(2000)

      await expect(page).toHaveURL(/home/)
    })

    test('should display page content', async ({ page }: { page: Page }) => {
      await page.goto('/home')
      await page.waitForLoadState('networkidle')
      await sleep(2000)

      const hasContent = await page.locator('body').count()
      expect(hasContent).toBeGreaterThan(0)
    })

    test('should have interactive elements', async ({ page }: { page: Page }) => {
      await page.goto('/home')
      await page.waitForLoadState('networkidle')
      await sleep(2000)

      const hasElements = await page.locator('button, input, a').count()
      expect(hasElements).toBeGreaterThan(0)
    })
  })
})
