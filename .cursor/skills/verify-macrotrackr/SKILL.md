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
bun .cursor/skills/verify-macrotrackr/scripts/verify-public-landing.mjs \
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

- `scripts/verify-public-landing.mjs`: verifies the rendered public landing
  headline and primary CTA, then saves a screenshot and JSON result.
- `frontend/e2e/growth-canary.test.ts`: drives disposable managed-account and
  importer journeys, checks PostHog, and cleans up Clerk users.
