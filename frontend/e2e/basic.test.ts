import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

test.describe('E2E Basic Tests', () => {
  test.describe('Landing Page', () => {
    test('should load the landing page', async ({ page }: { page: Page }) => {
      await page.goto('/')
      await expect(page).toHaveTitle(/.+/)
    })

    test('should show the main heading', async ({ page }: { page: Page }) => {
      await page.goto('/')
      await expect(page.locator('h1')).toBeVisible()
    })
  })

  test.describe('Navigation', () => {
    test('should have working navigation links', async ({ page }: { page: Page }) => {
      await page.goto('/')
      const links = await page.locator('a[href]').all()
      expect(links.length).toBeGreaterThan(0)
    })
  })

  test.describe('Performance', () => {
    test('should load page within reasonable time', async ({ page }: { page: Page }) => {
      const startTime = Date.now()
      await page.goto('/')
      const loadTime = Date.now() - startTime
      expect(loadTime).toBeLessThan(10000)
    })

    test('should not have critical console errors', async ({ page }: { page: Page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text())
        }
      })

      await page.goto('/')
      await page.waitForLoadState('networkidle')

      const criticalErrors = errors.filter(
        (e) => !e.includes('favicon') && !e.includes('net::ERR_')
      )
      expect(criticalErrors.length).toBe(0)
    })
  })

  test.describe('Accessibility', () => {
    test('should have semantic HTML structure', async ({ page }: { page: Page }) => {
      await page.goto('/')
      const header = await page.locator('header').isVisible().catch(() => false)
      const main = await page.locator('main').isVisible().catch(() => false)
      const footer = await page.locator('footer').isVisible().catch(() => false)
      expect(header || main || footer).toBe(true)
    })

    test('should have a proper document title', async ({ page }: { page: Page }) => {
      await page.goto('/')
      const title = await page.title()
      expect(typeof title).toBe('string')
      expect(title.length).toBeGreaterThan(0)
    })
  })

  test.describe('Page Content', () => {
    test('should render content', async ({ page }: { page: Page }) => {
      await page.goto('/')
      const body = page.locator('body')
      await expect(body).toBeVisible()
      const html = await body.innerHTML()
      expect(html?.length).toBeGreaterThan(100)
    })

    test('should have proper lang attribute', async ({ page }: { page: Page }) => {
      await page.goto('/')
      const lang = await page.evaluate(() => document.documentElement.lang)
      expect(lang).toBeTruthy()
    })
  })
})
