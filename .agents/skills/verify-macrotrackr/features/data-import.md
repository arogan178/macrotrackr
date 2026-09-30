# Data import

## Sub-features

- Format detection
- Import preview
- Import execution
- Import activation events

## How to get to it (user POV)

Open `/settings?tab=data`, select an export file, review the preview, and
confirm the import.

## Driving it with Playwright

Create the minimal MyFitnessPal CSV in the current test output directory, set
it on the file input, assert the preview row, confirm import, and assert `Import
Successful!`. Verify `import_previewed`, `import_completed`, and
`first_meal_logged` in PostHog.

## Gotchas

- Keep fixtures free of real nutrition or health data.
- The test output directory is disposable, but the PostHog evidence is kept as
  an artifact.
