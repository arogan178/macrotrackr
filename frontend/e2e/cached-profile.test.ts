import { expect, type Page, test } from '@playwright/test'
import { loginWithTestUser } from './helpers/auth'

const QUERY_CACHE = 'macrotrackr-query-cache'

// Rewrites the persisted copy of the signed-in user, as if this device saved it
// an hour ago, before the profile was finished somewhere else.
async function markPersistedProfileUnfinished(page: Page) {
  await page.evaluate(async (name) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(name, 1)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const store = () => database.transaction('entries', 'readwrite').objectStore('entries')
    const raw = await new Promise<string>((resolve, reject) => {
      const request = store().get(name)
      request.onsuccess = () => resolve(request.result as string)
      request.onerror = () => reject(request.error)
    })
    const client = JSON.parse(raw)
    const user = client.clientState.queries.find(
      (query: { queryKey: unknown[] }) => query.queryKey.join('/') === 'auth/user',
    )
    user.state.data = { ...user.state.data, isProfileComplete: false, dateOfBirth: null }
    user.state.dataUpdatedAt = Date.now() - 60 * 60 * 1000
    await new Promise<void>((resolve, reject) => {
      const request = store().put(JSON.stringify(client), name)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }, QUERY_CACHE)
}

test.describe('signed-in launch', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.E2E_CLERK_USER_EMAIL || !process.env.E2E_CLERK_USER_PASSWORD, 'needs the e2e user')
    await loginWithTestUser(page)
    await expect(page.getByRole('heading', { name: 'Log a Meal' })).toBeVisible()
  })

  test('Back after signing in does not return to the sign-in handoff', async ({ page }) => {
    await page.goBack()

    expect(page.url()).not.toContain('/auth-ready')
  })

  test('a persisted unfinished profile defers to the finished one on the server', async ({ page }) => {
    // The persister writes on a throttle; let it land before rewriting it.
    await page.waitForTimeout(2000)
    await markPersistedProfileUnfinished(page)

    await page.goto('/home')

    await expect(page.getByRole('heading', { name: 'Log a Meal' })).toBeVisible()
    await expect(page).toHaveURL(/\/home/)
  })
})
