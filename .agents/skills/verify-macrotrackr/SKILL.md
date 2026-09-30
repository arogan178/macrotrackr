---
name: verify-macrotrackr
description: Drive MacroTrackr through its public and authenticated user journeys, capture durable evidence, and clean up disposable test state.
---

# Verify MacroTrackr

Use this skill after changing a user-visible MacroTrackr journey or its analytics.

## Launch

For a public production check, use `https://macrotrackr.com` directly.

For a local production build:

```sh
bun run build
bunx --cwd frontend vite preview --host 127.0.0.1 --port 4173
```

Record the preview process ID. Do not kill processes by name.

For local dev, start `bun run dev:backend` and `bun run dev:frontend` and
record both process IDs. Both default to local auth, not Clerk.

## Sign in

Local dev skips the login form with a persistent test account:

```sh
bun .agents/skills/verify-macrotrackr/scripts/sign-in.mjs
```

It logs in `verify-agent@example.com` (registering it on first run) and saves
the session to `.artifacts/verify-macrotrackr/auth-state.json`. Load that file
as Playwright `storageState` in any script that drives signed-in pages, or open
a signed-in browser with:

```sh
bunx playwright open --load-storage=.artifacts/verify-macrotrackr/auth-state.json http://localhost:5173/home
```

Rerun the script if pages redirect to `/login`. Pass `--email` for a separate
account when a check needs fresh state. The account has no profile until you
complete `features/profile-onboarding.md` once.

Authenticated managed checks require the secrets documented by
`.github/workflows/growth-health.yml`. Run them with:

```sh
GROWTH_CANARY=true bun run --cwd frontend test:growth-canary
```

## Doctor

Before driving the UI:

```sh
curl --fail --silent --show-error "$BASE_URL/" >/dev/null
```

For the managed canary, also run:

```sh
bun run --cwd frontend test:growth-canary -- --list
```

If either command fails, fix launch or configuration before interacting with
the application.

## Drive

Use the smallest feature file in `features/` that covers the change. Prefer
roles, labels, and visible names over CSS selectors. Never send analytics
events directly when the user journey can produce them.

Public landing verification:

```sh
bun .agents/skills/verify-macrotrackr/scripts/verify-public-landing.mjs \
  --base-url "${BASE_URL:-https://macrotrackr.com}" \
  --output-dir .artifacts/verify-macrotrackr/public-landing
```

## Evidence

Keep screenshots, traces, and machine-readable results under
`.artifacts/verify-macrotrackr/` locally or as GitHub Actions artifacts. Each
result must state the URL, timestamp, assertions, and outcome.

For analytics checks, the managed canary writes `posthog-events.json` beside
the Playwright trace. A passing page interaction without its expected event is
not a passing analytics check.

## Cleanup

Close the browser context. If a local preview was started, kill only the
recorded process ID and confirm the port is closed. The managed canary deletes
the exact disposable Clerk user it created; the Clerk deletion webhook removes
the matching application account. Never bulk-delete users or database rows.

Do not delete `.artifacts/verify-macrotrackr/` until the evidence has been
reviewed. It is ignored by Git.

## Helpers

- `scripts/sign-in.mjs`: signs the local test account in and saves its session
  as Playwright storage state.
- `scripts/verify-public-landing.mjs`: verifies the rendered public landing
  headline and primary CTA, then saves a screenshot and JSON result.
- `frontend/e2e/growth-canary.test.ts`: drives disposable managed-account and
  importer journeys, checks PostHog, and cleans up Clerk users.
