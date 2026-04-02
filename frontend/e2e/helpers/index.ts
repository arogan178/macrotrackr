import type { Page } from '@playwright/test'

export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
export const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000'

export const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'your_email+clerk_test@example.com'
export const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPassword123!'
export const TEST_VERIFICATION_CODE = process.env.TEST_VERIFICATION_CODE || '424242'

export async function isServerAvailable(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok
  } catch {
    return false
  }
}

export async function waitForElement(page: Page, selector: string, timeout = 10000): Promise<void> {
  await page.locator(selector).first().waitFor({ state: 'visible', timeout })
}

export async function clickButton(page: Page, text: string): Promise<void> {
  await page.locator(`button:has-text("${text}")`).click()
}

export async function fillInput(page: Page, selector: string, value: string): Promise<void> {
  await page.locator(selector).fill(value)
}

export async function getText(page: Page, selector: string): Promise<string> {
  return (await page.locator(selector).textContent()) || ''
}

export async function isVisible(page: Page, selector: string): Promise<boolean> {
  try {
    await page.locator(selector).waitFor({ timeout: 5000 })
    return await page.locator(selector).isVisible()
  } catch {
    return false
  }
}

export async function waitForUrl(page: Page, pattern: string | RegExp): Promise<void> {
  await page.waitForURL(pattern, { timeout: 30000 })
}

export async function waitForPageReady(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded')
  await page.waitForLoadState('networkidle')
}

export async function waitForAnyVisible(
  page: Page,
  selectors: string[],
  timeout = 10000,
): Promise<string> {
  for (const selector of selectors) {
    try {
      await page.locator(selector).first().waitFor({ state: 'visible', timeout })
      return selector
    } catch {
      // try the next selector
    }
  }

  throw new Error(`None of the expected selectors became visible: ${selectors.join(', ')}`)
}

export function generateRandomEmail(): string {
  const timestamp = Date.now()
  return `test_${timestamp}@example.com`
}

export function generateRandomPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  const randomValues = new Uint32Array(12)
  crypto.getRandomValues(randomValues)
  let password = 'Test'
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(randomValues[i] % chars.length)
  }
  return password
}

export async function getConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })
  await page.goto(FRONTEND_URL)
  await page.waitForLoadState('networkidle')
  return errors.filter(e => !e.includes('favicon') && !e.includes('net::ERR_'))
}

export async function takeScreenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `e2e/screenshots/${name}-${Date.now()}.png` })
}
