import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { loginWithTestUser } from './helpers/auth'

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

      await expect(page).toHaveURL(/goals/)
      await expect(page.getByRole('heading', { name: 'Your Goals', level: 1 })).toBeVisible()
    })

    test('should display page content', async ({ page }: { page: Page }) => {
      await page.goto('/goals')

      await expect(page.getByRole('heading', { name: 'Habit Goals' })).toBeVisible()
    })

    test('should have interactive elements', async ({ page }: { page: Page }) => {
      await page.goto('/goals')

      // The suite's user starts with no goals, so the setup actions show.
      await expect(page.getByRole('button', { name: 'Set Weight Goal' })).toBeEnabled()
      await expect(page.getByRole('button', { name: 'Add First Habit' })).toBeEnabled()
    })
  })
})
