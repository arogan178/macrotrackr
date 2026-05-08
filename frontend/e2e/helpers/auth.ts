import type { Page } from '@playwright/test'
import { waitForAnyVisible, waitForPageReady } from './index'

export interface TestUser {
  email: string
  password: string
}

export async function navigateToSignUp(page: Page): Promise<void> {
  await page.goto('/register')
  await waitForPageReady(page)
  await waitForAnyVisible(page, ['input[type="email"]', 'input[name="email"]'])
}

export async function navigateToSignIn(page: Page): Promise<void> {
  await page.goto('/login')
  await waitForPageReady(page)
  await waitForAnyVisible(page, ['input[type="email"]', 'input[name="email"]'])
}

/**
 * Sign in using UI interaction
 * Handles Clerk's login form with both OAuth and email/password
 */
export async function signInWithUI(page: Page, email: string, password: string): Promise<void> {
  await navigateToSignIn(page)

  await waitForAnyVisible(page, ['input[name="email"]', 'input[type="email"]'])
  
  // Check if we're on the right page (not redirected to Google)
  const urlString = page.url()
  try {
    const url = new URL(urlString)
    if (url.hostname === 'accounts.google.com') {
      throw new Error('Redirected to Google OAuth. Please ensure the app allows email/password login.')
    }
  } catch (e) {
    // If URL parsing fails, ignore and proceed
  }
  
  // Fill in email - look for email input field
  const emailInput = page.locator('input[name="email"]').first()
  await emailInput.fill(email)

  // Fill in password
  const passwordInput = page.locator('input[name="password"]').first()
  await passwordInput.fill(password)

  // Click the "Sign In" button specifically (not "Sign up" or social buttons)
  // Based on debug output, "Sign In" is the button with exact text
  const submitButton = page.locator('button:has-text("Sign In")').first()
  await submitButton.click()

  // Wait for redirect to authenticated page
  await page.waitForURL(/\/home|\/dashboard/, { timeout: 10000 })
  await waitForPageReady(page)
}

/**
 * UI-based sign up for testing registration flow
 */
export async function signUpViaUI(page: Page, email: string, password: string): Promise<void> {
  await navigateToSignUp(page)

  await waitForAnyVisible(page, ['input[type="email"]', 'input[name="email"]'])

  // Fill in the registration form
  const firstNameInput = page.locator('input[name="firstName"], input[placeholder*="First"]').first()
  if (await firstNameInput.isVisible().catch(() => false)) {
    await firstNameInput.fill('Test')
  }

  const lastNameInput = page.locator('input[name="lastName"], input[placeholder*="Last"]').first()
  if (await lastNameInput.isVisible().catch(() => false)) {
    await lastNameInput.fill('User')
  }

  const emailInput = page.locator('input[type="email"], input[name="email"]').first()
  await emailInput.fill(email)

  const passwordInput = page.locator('input[type="password"], input[name="password"]').first()
  await passwordInput.fill(password)

  // Submit form
  const submitButton = page.locator('button[type="submit"], button:has-text("Create Account")').first()
  await submitButton.click()

  await Promise.race([
    page.waitForURL(/\/home|\/dashboard|verify|register|confirm|auth/, { timeout: 15000 }),
    waitForAnyVisible(page, ['[role="alert"]', 'text=verify', 'text=Check your email'], 15000),
  ])

  await waitForPageReady(page)
}

export async function isAuthenticated(page: Page): Promise<boolean> {
  const url = page.url()
  return !url.includes('/login') && !url.includes('/register') && !url.includes('/auth/')
}

/**
 * Login with existing test user credentials
 * Requires E2E_CLERK_USER_EMAIL and E2E_CLERK_USER_PASSWORD env vars
 */
export async function loginWithTestUser(page: Page, email?: string, password?: string): Promise<void> {
  const userEmail = email || process.env.E2E_CLERK_USER_EMAIL
  const userPassword = password || process.env.E2E_CLERK_USER_PASSWORD

  if (!userEmail || !userPassword) {
    throw new Error('No test user credentials provided. Set E2E_CLERK_USER_EMAIL and E2E_CLERK_USER_PASSWORD environment variables.')
  }

  await signInWithUI(page, userEmail, userPassword)
}
