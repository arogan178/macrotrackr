import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createClerkClient } from '@clerk/backend'
import { clerk, setupClerkTestingToken } from '@clerk/testing/playwright'
import { type BrowserContext, chromium, expect, type Page, test } from '@playwright/test'
import { BACKEND_URL, PREVIEW_URL } from './helpers'

interface ServerEntry {
  id: number
  clientId: string
  mealName: string
}

const ELEVEN_MINUTES = 11 * 60 * 1000

// The page clock stays behind real time. Ahead of it, Clerk treats every
// session token as expired and refreshes on each request until it is
// rate-limited. Home also remounts its form when the day changes, which drops
// a half-typed entry, so the run stays on one day.
function startOfRun(): number {
  const start = new Date(Date.now() - 12 * 60 * 1000)
  const end = new Date(start.getTime() + 15 * 60 * 1000)
  if (end.getDate() !== start.getDate()) start.setHours(23, 30, 0, 0)

  return start.getTime()
}

/**
 * Runs against a production build, because only its service worker can open
 * the app with no network. The account is its own so the entries it logs
 * cannot leak into the specs that expect an empty log.
 */
test.describe('offline food logging', () => {
  test.skip(!process.env.CLERK_SECRET_KEY, 'needs the Clerk test instance')
  test.setTimeout(180_000)

  // The Clerk development instance holds 100 users, so every account this spec makes must go.
  const clerkApi = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

  // Clerk rate-limits the development instance, and a delete that hits the limit would leak the user.
  async function deleteClerkUser(userId: string) {
    for (let attempt = 0; ; attempt++) {
      try {
        await clerkApi.users.deleteUser(userId)

        return
      } catch (error) {
        const status = (error as { status?: number }).status
        if (status === 404) return
        if (status !== 429 || attempt === 5) throw error
        await new Promise((resolve) => setTimeout(resolve, 2000 * 2 ** attempt))
      }
    }
  }

  let run: string
  let email: string
  let clerkUserId: string | undefined
  let profileDir: string | undefined

  // A run killed before afterEach leaves its user behind; an hour is past any live run.
  // Best effort: a rate-limited sweep must not fail the test it precedes.
  test.beforeAll(async () => {
    const leftovers = await clerkApi.users
      .getUserList({ query: 'offline-', limit: 100 })
      .then(({ data }) => data)
      .catch(() => [])
    const stale = leftovers.filter(
      (user) =>
        /^offline-[a-z0-9]+\+clerk_test@example\.com$/.test(user.primaryEmailAddress?.emailAddress ?? '') &&
        Date.now() - user.createdAt > 60 * 60 * 1000,
    )
    for (const user of stale) await deleteClerkUser(user.id).catch(() => {})
  })

  test.beforeEach(async () => {
    run = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
    email = `offline-${run}+clerk_test@example.com`
    const user = await clerkApi.users.createUser({
      emailAddress: [email],
      password: `Offline-${run}-pass!`,
      firstName: 'Offline',
      lastName: 'Tester',
      skipPasswordChecks: true,
      legalAcceptedAt: new Date(),
    })
    clerkUserId = user.id
    profileDir = await mkdtemp(join(tmpdir(), 'macrotrackr-offline-'))
  })

  // Runs after a failure too.
  test.afterEach(async () => {
    test.setTimeout(test.info().timeout + 120_000)
    if (clerkUserId) await deleteClerkUser(clerkUserId)
    clerkUserId = undefined
    if (profileDir) await rm(profileDir, { recursive: true, force: true })
    profileDir = undefined
  })

  // A persistent profile keeps IndexedDB and the service worker across a restart.
  async function openApp(options: { offline: boolean; now: number }) {
    const context = await chromium.launchPersistentContext(profileDir as string, {
      baseURL: PREVIEW_URL,
      offline: options.offline,
      viewport: { width: 1280, height: 900 },
    })
    await context.clock.install({ time: options.now })
    const page = context.pages()[0] ?? (await context.newPage())

    return { context, page }
  }

  async function callApi(page: Page, path: string, init: { method?: string; body?: object } = {}) {
    return page.evaluate(
      async ({ url, method, body }) => {
        const clerkGlobal = (window as unknown as { Clerk: { session: { getToken: () => Promise<string> } } }).Clerk
        const token = await clerkGlobal.session.getToken()
        const response = await fetch(url, {
          method,
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: body ? JSON.stringify(body) : undefined,
        })
        if (!response.ok) throw new Error(`${url} answered ${response.status}`)

        return response.json() as Promise<unknown>
      },
      { url: `${BACKEND_URL}${path}`, method: init.method ?? 'GET', body: init.body },
    )
  }

  async function logEntry(page: Page, mealName: string, protein: number) {
    const form = page.locator('form').filter({ has: page.getByLabel('Meal Name') })
    await form.getByLabel('Meal Name').fill(mealName)
    await form.getByLabel('Protein').fill(String(protein))
    await form.getByLabel('Carbs').fill('10')
    await form.getByLabel('Fats').fill('5')
    await form.getByRole('button', { name: 'Add Entry' }).click()
    await expect(page.getByText(mealName).first()).toBeVisible()
  }

  async function logSavedMeal(page: Page, mealName: string) {
    await page.getByRole('textbox', { name: 'Search for food' }).click()
    await page.getByRole('tab', { name: 'Saved Meals' }).click()
    await page.getByRole('button', { name: new RegExp(mealName) }).first().click()
    await expect(page.getByLabel('Meal Name')).toHaveValue(mealName)
    await page.getByRole('button', { name: 'Add Entry' }).click()
    await expect(page.getByText(mealName).filter({ visible: true }).first()).toBeVisible()
  }

  async function now(context: BrowserContext) {
    return context.pages()[0]!.evaluate(() => Date.now())
  }

  test('keeps entries logged offline across a restart and sends each once, in order', async () => {
    const names = ['Offline oats', 'Offline eggs', 'Offline soup', 'Offline toast'].map((name) => `${name} ${run}`)

    // Online: sign in once, finish the profile, and let the service worker cache the app.
    let { context, page } = await openApp({ offline: false, now: startOfRun() })
    await setupClerkTestingToken({ page })
    await page.goto('/login')
    await clerk.signIn({ page, emailAddress: email })
    await callApi(page, '/api/auth/clerk-sync', { method: 'POST', body: {} })
    await callApi(page, '/api/user/complete-profile', {
      method: 'POST',
      body: { dateOfBirth: '1990-01-01', height: 180, weight: 80, gender: 'male', activityLevel: 3, unitSystem: 'metric' },
    })
    await callApi(page, '/api/saved-meals', {
      method: 'POST',
      body: { name: names[3], protein: 14, carbs: 10, fats: 5, mealType: 'breakfast' },
    })
    await page.goto('/home')
    await expect(page.getByRole('heading', { name: 'No entries yet' })).toBeVisible()
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready
    })

    // Offline for longer than ten minutes, logging as the time passes.
    await context.setOffline(true)
    await logEntry(page, names[0]!, 11)
    await logEntry(page, names[1]!, 12)
    await context.clock.fastForward(ELEVEN_MINUTES)
    await logEntry(page, names[2]!, 13)
    await expect(page.getByText('Offline. Entries you log are kept on this device')).toBeVisible()

    // Close the app and open it again with no network at all.
    const offlineNow = await now(context)
    await context.close()
    ;({ context, page } = await openApp({ offline: true, now: offlineNow }))
    await page.goto('/home')
    for (const name of names.slice(0, 3)) {
      await expect(page.getByText(name).first()).toBeVisible()
    }
    await logSavedMeal(page, names[3]!)

    // Back online, half-typed input survives: the reload Clerk needs waits for the next screen.
    await page.getByLabel('Meal Name').fill('Half typed')
    await context.setOffline(false)
    await page.waitForTimeout(2000)
    await expect(page.getByLabel('Meal Name')).toHaveValue('Half typed')
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: 'Goals' }).click()
    await page.waitForURL(/goals/)
    await expect
      .poll(
        async () => {
          try {
            const history = (await callApi(page, '/api/macros/history?limit=100')) as { entries: ServerEntry[] }

            return history.entries.filter((entry) => entry.mealName.endsWith(run)).length
          } catch {
            return -1
          }
        },
        { timeout: 60_000 },
      )
      .toBe(names.length)

    const history = (await callApi(page, '/api/macros/history?limit=100')) as { entries: ServerEntry[] }
    const synced = history.entries
      .filter((entry) => entry.mealName.endsWith(run))
      .sort((a, b) => a.id - b.id)
    expect(synced.map((entry) => entry.mealName)).toEqual(names)
    expect(new Set(synced.map((entry) => entry.clientId)).size).toBe(names.length)

    // Each entry shows once, now from the server.
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: 'Home', exact: true }).click()
    for (const name of names) {
      await expect(page.getByText(name).filter({ visible: true })).toHaveCount(1)
    }
    await context.close()
  })
})
