import type { Page } from '@playwright/test'
import { TEST_VERIFICATION_CODE, waitForAnyVisible, waitForPageReady } from './index'

export interface TestUser {
  email: string
  password: string
}

/**
 * Both auth screens open on the social providers. The email fields are behind
 * "Continue with email", so every helper that wants them has to ask first.
 */
async function revealEmailForm(page: Page): Promise<void> {
  const emailField = page.locator('input[name="email"]').first()
  if (await emailField.isVisible().catch(() => false)) {
    return
  }

  const continueWithEmail = page
    .locator('button:has-text("Continue with email")')
    .first()
  if (await continueWithEmail.isVisible().catch(() => false)) {
    await continueWithEmail.click()
  }
}

export async function navigateToSignUp(page: Page): Promise<void> {
  await page.goto('/register')
  await waitForPageReady(page)
  await revealEmailForm(page)
  await waitForAnyVisible(page, ['input[type="email"]', 'input[name="email"]'])
}

export async function navigateToSignIn(page: Page): Promise<void> {
  await page.goto('/login')
  await waitForPageReady(page)
  await revealEmailForm(page)
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
  const url = page.url()
  if (url.includes('accounts.google.com')) {
    throw new Error('Redirected to Google OAuth. Please ensure the app allows email/password login.')
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

  // Legal consent is a required sign-up field on the Clerk instance, so the
  // submit stays disabled until it is ticked.
  const consentCheckbox = page.locator('input[name="legalAccepted"]').first()
  if (await consentCheckbox.isVisible().catch(() => false)) {
    await consentCheckbox.check()
  }

  // Submit form
  const submitButton = page.locator('button[type="submit"], button:has-text("Create Account")').first()
  await submitButton.click()

  await completeEmailVerification(page)

  await waitForPageReady(page)
}

/**
 * Clerk puts any address containing +clerk_test into test mode: no mail is
 * sent and TEST_VERIFICATION_CODE is accepted. Without this step the sign-up
 * stops at the verify screen and never becomes an account, which is how the
 * registration test came to assert nothing.
 */
export async function completeEmailVerification(page: Page): Promise<void> {
  const codeInput = page.locator('input[name="verificationCode"]').first()

  try {
    await codeInput.waitFor({ state: 'visible', timeout: 15000 })
  } catch {
    // Sign-up completed without a verification step.
    return
  }

  await codeInput.fill(TEST_VERIFICATION_CODE)
  await page.locator('button:has-text("Verify Email")').first().click()
  await page.waitForURL(/\/profile-setup|\/home|\/dashboard|\/auth-ready/, {
    timeout: 20000,
  })
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
