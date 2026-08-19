# Public landing

## Sub-features

- Initial rendered headline
- Primary registration CTA
- Calculator secondary path
- UTM-bearing entry URLs

## How to get to it (user POV)

Open `/` while signed out. The primary action is `Start free`.

## Driving it with Playwright

Run `scripts/verify-public-landing.mjs`. It loads the page, asserts the real
headline and primary CTA, checks that the CTA targets registration, and saves
evidence.

## Gotchas

- Use a hard navigation so the server-delivered HTML and startup path are
  exercised.
- The service worker may cache a previous build in a long-lived browser. The
  helper uses a fresh browser context.
