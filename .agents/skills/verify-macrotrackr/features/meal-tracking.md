# Meal tracking

## Sub-features

- Manual meal fields
- Entry submission
- First-meal activation event

## How to get to it (user POV)

Finish onboarding and use `Log a Meal` on `/home`.

## Driving it with Playwright

Fill the labelled meal name, protein, carbs, and fats inputs, choose `Add
Entry`, and assert that the meal appears in history. The managed canary then
requires `first_meal_logged` in PostHog.

## Gotchas

- Do not call the macro API directly; that misses the form and client journey.
- Use a unique meal name when debugging repeated runs.
