import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { loginWithTestUser } from './helpers/auth'

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

      await expect(page).toHaveURL(/home/)
      await expect(page.getByRole('heading', { name: 'Log a Meal' })).toBeVisible()
    })

    test('should display page content', async ({ page }: { page: Page }) => {
      await page.goto('/home')

      // The suite's user starts with an empty log.
      await expect(page.getByRole('heading', { name: 'No entries yet' })).toBeVisible()
    })

    test('should have interactive elements', async ({ page }: { page: Page }) => {
      await page.goto('/home')

      await expect(page.getByRole('textbox', { name: 'Search for food' })).toBeEditable()
    })
  })
})
