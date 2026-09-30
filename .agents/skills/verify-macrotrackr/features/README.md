# MacroTrackr verification map

Start with the feature closest to the change:

- `public-landing.md`: anonymous landing and registration entry point.
- `profile-onboarding.md`: managed signup handoff and profile completion.
- `meal-tracking.md`: first manual meal and activation.
- `data-import.md`: importer preview, execution, and activation events.
- `billing.md`: paywall and checkout-session creation.

Authenticated features run locally with the saved session from
`scripts/sign-in.mjs`, or in production with the disposable-user managed canary.
Public pages use the lightweight landing helper.
