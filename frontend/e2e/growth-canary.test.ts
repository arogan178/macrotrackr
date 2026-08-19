import { mkdir, writeFile } from "node:fs/promises";
import { createClerkClient } from "@clerk/backend";
import { setupClerkTestingToken } from "@clerk/testing/playwright";
import { expect, test, type Page, type TestInfo } from "@playwright/test";

const MANUAL_EVENTS = [
  "landing_cta_clicked",
  "signup_started",
  "signup_completed",
  "profile_completed",
  "first_meal_logged",
  "paywall_viewed",
  "checkout_started",
] as const;

const IMPORT_EVENTS = [
  "landing_cta_clicked",
  "signup_started",
  "signup_completed",
  "profile_completed",
  "import_previewed",
  "import_completed",
  "first_meal_logged",
] as const;

interface ManagedUser {
  email: string;
  clerkUserId: string;
}

interface PostHogQueryResponse {
  results?: Array<[string, number]>;
}

interface ClerkErrorResponse {
  errors?: Array<{ code?: string; long_message?: string; message?: string }>;
}

function requireEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function escapeHogQlString(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("'", "\\'");
}

async function createManagedUser(label: string): Promise<ManagedUser> {
  const domain = requireEnvironment("GROWTH_CANARY_EMAIL_DOMAIN");
  const password = requireEnvironment("GROWTH_CANARY_USER_PASSWORD");
  const secretKey = requireEnvironment("CLERK_SECRET_KEY");
  const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const email = `macrotrackr-${label}-clerk-test-${runId}@${domain}`;
  const clerk = createClerkClient({ secretKey });
  const user = await clerk.users.createUser({
    emailAddress: [email],
    firstName: "Growth",
    lastName: "Canary",
    password,
    skipLegalChecks: true,
  });

  return { clerkUserId: user.id, email };
}

async function deleteManagedUser(user: ManagedUser): Promise<void> {
  const clerk = createClerkClient({
    secretKey: requireEnvironment("CLERK_SECRET_KEY"),
  });
  await clerk.users.deleteUser(user.clerkUserId);
}

async function registerThroughUi(page: Page, user: ManagedUser): Promise<void> {
  await setupClerkTestingToken({ page });
  await page.goto("/?utm_source=growth_canary&utm_medium=synthetic");
  const headline = page.getByRole("heading", {
    name: /Know what you ate\. Without the admin\./u,
  });
  await page
    .locator("section")
    .filter({ has: headline })
    .first()
    .getByRole("link", { name: "Start free", exact: true })
    .click();
  await expect(page).toHaveURL(/\/register/u);
  await page.getByRole("button", { name: "Continue with email" }).click();
  await page.getByLabel("First Name").fill("Growth");
  await page.getByLabel("Last Name").fill("Canary");
  await page.getByLabel("Email").fill(user.email);
  await page
    .getByLabel("Password")
    .fill(requireEnvironment("GROWTH_CANARY_USER_PASSWORD"));
  const signupResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/v1/client/sign_ups") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Create Account" }).click();
  const signupResponse = await signupResponsePromise;
  if (!signupResponse.ok()) {
    const payload = (await signupResponse.json()) as ClerkErrorResponse;
    const expectedDuplicateCodes = new Set([
      "form_identifier_exists",
      "identifier_already_signed_up",
    ]);
    const unexpectedError = payload.errors?.find(
      ({ code }) => !code || !expectedDuplicateCodes.has(code),
    );
    if (unexpectedError) {
      throw new Error(
        unexpectedError.long_message ??
          unexpectedError.message ??
          `Clerk sign-up failed with ${signupResponse.status()}`,
      );
    }
  }
  await expect(page).toHaveURL(/\/profile-setup/u, { timeout: 30_000 });
}

async function completeProfile(
  page: Page,
  switchingSource: "myfitnesspal" | "new_to_tracking",
): Promise<void> {
  await page.getByLabel("Date of Birth").fill("1990-01-01");
  await page.getByLabel("Gender").selectOption("male");
  await page.getByLabel(/Height/u).fill("180");
  await page.getByLabel(/Weight/u).fill("80");
  await page.getByRole("button", { name: "Continue" }).click();
  await page
    .getByLabel("How active are you on a typical week?")
    .selectOption("3");
  await page.getByRole("button", { name: "Continue" }).click();
  await page
    .getByLabel("What are you switching from?")
    .selectOption(switchingSource);
  await page.getByRole("radio", { name: "Maintain" }).click();
  await page.getByRole("button", { name: "Finish setup" }).click();
  await expect(page).toHaveURL(/\/home/u, { timeout: 30_000 });
}

async function logManualMeal(page: Page): Promise<void> {
  await page.getByLabel("Meal Name").fill("Growth canary meal");
  await page.getByLabel("Protein").fill("30");
  await page.getByLabel("Carbs").fill("40");
  await page.getByLabel("Fats").fill("10");
  await page.getByRole("button", { name: "Add Entry" }).click();
  await expect(page.getByText("Growth canary meal").first()).toBeVisible();
}

async function openPaywallAndCheckout(page: Page): Promise<void> {
  await page.goto("/reporting");
  await page.getByRole("tab", { name: /30 Days/u }).click();
  await expect(
    page.getByRole("heading", { name: "Unlock Pro Features" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Upgrade to Pro" }).click();
  await expect(page).toHaveURL(/\/pricing/u);

  const checkoutRequest = page.waitForResponse(
    (response) =>
      response.url().includes("/api/billing/checkout") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Upgrade to Pro" }).click();
  const response = await checkoutRequest;
  expect(response.ok()).toBe(true);
}

async function importMyFitnessPal(
  page: Page,
  testInfo: TestInfo,
): Promise<void> {
  const fixturePath = testInfo.outputPath("myfitnesspal-canary.csv");
  await mkdir(testInfo.outputDir, { recursive: true });
  await writeFile(
    fixturePath,
    [
      "Date,Meal,Calories,Fat (g),Carbohydrates (g),Protein (g),Note",
      "2026-08-18,Breakfast,450,15,45,30,Growth canary oats",
    ].join("\n"),
  );

  await page.goto("/settings?tab=data");
  await expect(page.getByText("1-Click Data Importer")).toBeVisible();
  await page.locator('input[type="file"]').setInputFiles(fixturePath);
  await expect(page.getByText("Growth canary oats")).toBeVisible();
  await page.getByRole("button", { name: "Import 1 Entries" }).click();
  await expect(
    page.getByRole("heading", { name: "Import Successful!" }),
  ).toBeVisible();
}

async function queryPostHogEvents(email: string): Promise<Map<string, number>> {
  const apiKey = requireEnvironment("POSTHOG_PERSONAL_API_KEY");
  const projectId = requireEnvironment("POSTHOG_PROJECT_ID");
  const host = (
    process.env.POSTHOG_API_HOST ?? "https://eu.posthog.com"
  ).replace(/\/$/u, "");
  const query = `
    SELECT event, count() AS events
    FROM events
    WHERE timestamp >= now() - INTERVAL 1 HOUR
      AND person.properties.email = '${escapeHogQlString(email)}'
    GROUP BY event
    ORDER BY event
  `;
  const response = await fetch(
    `${host}/api/projects/${encodeURIComponent(projectId)}/query/`,
    {
      body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    },
  );
  if (!response.ok) {
    throw new Error(`PostHog query failed with ${response.status}`);
  }
  const body = (await response.json()) as PostHogQueryResponse;
  return new Map(
    (body.results ?? []).map(([event, count]) => [event, Number(count)]),
  );
}

async function expectPostHogEvents(
  expectedEvents: readonly string[],
  user: ManagedUser,
  testInfo: TestInfo,
): Promise<void> {
  let observed = new Map<string, number>();
  await expect
    .poll(
      async () => {
        observed = await queryPostHogEvents(user.email);
        return expectedEvents.filter((event) => !observed.has(event));
      },
      { intervals: [2_000, 5_000, 10_000], timeout: 60_000 },
    )
    .toEqual([]);

  await writeFile(
    testInfo.outputPath("posthog-events.json"),
    JSON.stringify(Object.fromEntries(observed), null, 2),
  );
}

test.skip(
  process.env.GROWTH_CANARY !== "true",
  "Set GROWTH_CANARY=true to run against a managed environment",
);

test("fresh account reaches checkout and emits the managed funnel", async ({
  page,
}, testInfo) => {
  const user = await createManagedUser("manual");
  try {
    await registerThroughUi(page, user);
    await completeProfile(page, "new_to_tracking");
    await logManualMeal(page);
    await openPaywallAndCheckout(page);
    await expectPostHogEvents(MANUAL_EVENTS, user, testInfo);
  } finally {
    await deleteManagedUser(user);
  }
});

test("fresh importer account activates through historical data", async ({
  page,
}, testInfo) => {
  const user = await createManagedUser("import");
  try {
    await registerThroughUi(page, user);
    await completeProfile(page, "myfitnesspal");
    await importMyFitnessPal(page, testInfo);
    await expectPostHogEvents(IMPORT_EVENTS, user, testInfo);
  } finally {
    await deleteManagedUser(user);
  }
});
