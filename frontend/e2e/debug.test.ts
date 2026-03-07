import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

test.describe('Debug Login Page', () => {
  test('should show login page structure', async ({ page }: { page: Page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/login-page.png' })
    
    // Log all buttons
    const buttons = await page.locator('button').all()
    console.log('Buttons found:', buttons.length)
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent()
      console.log(`Button ${i}: ${text}`)
    }
    
    // Log all inputs
    const inputs = await page.locator('input').all()
    console.log('Inputs found:', inputs.length)
    for (let i = 0; i < inputs.length; i++) {
      const type = await inputs[i].getAttribute('type')
      const name = await inputs[i].getAttribute('name')
      const placeholder = await inputs[i].getAttribute('placeholder')
      console.log(`Input ${i}: type=${type}, name=${name}, placeholder=${placeholder}`)
    }
    
    // Check for email input
    const emailInput = page.locator('input[type="email"], input[name="email"]').first()
    await expect(emailInput).toBeVisible()
  })
})
