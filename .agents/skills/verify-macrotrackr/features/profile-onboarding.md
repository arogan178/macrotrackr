# Profile onboarding

## Sub-features

- Registration entry
- Clerk account handoff
- Basic profile
- Activity level
- Switching source
- Initial weight goal

## How to get to it (user POV)

Choose `Start free`, continue with email, and finish the three onboarding
steps.

## Driving it with Playwright

Use `registerThroughUi` and `completeProfile` in
`frontend/e2e/growth-canary.test.ts`. The canary provisions a verified,
disposable Clerk user first so production email verification is not required.

## Gotchas

- The test email local part must contain `+clerk_test` so analytics classifies
  it as synthetic.
- `What are you switching from?` is required and uses fixed values.
- Wait for `/home`; a button click alone does not prove backend sync completed.
