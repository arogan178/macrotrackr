# MacroTrackr v2.5: Compact Mobile Layouts, Sleeker Navigation, and Search Improvements

MacroTrackr v2.5 delivers a major mobile UX upgrade—reducing vertical scrolling by up to 50% across key screens, refining form inputs, polishing navigation, and ensuring seamless infrastructure routing.

## What's New in v2.5

### 1. Compact 3-Column Mobile Layouts
On mobile screens, key metrics and macro target cards previously stacked into full-width vertical rows, forcing excessive vertical scrolling. 

In v2.5, we optimized layout density:
- **Goals Page**: The weekly rate, estimated duration, and daily deficit/surplus stats now sit side-by-side in a compact 3-column row on mobile screens.
- **Daily Nutrition Target**: Protein, carbs, and fats are laid out in a responsive 3-column horizontal grid with separated gram and percentage indicators (`0g / 191g (0%)`), eliminating text wrapping and unit collisions.
- **Analytics & Reporting**: Summary cards and chart containers feature updated responsive padding (`p-3.5 sm:p-6`) and spacing for a cleaner, unified presentation.

### 2. Refined Form Inputs & Search Experience
Logging meals and searching for food is faster and cleaner:
- **Search Button**: Configured food search with responsive sizing—showing a compact icon button on mobile and full "Search →" button on desktop.
- **Ghost Input Text**: Inputs and placeholders use subtle, responsive font sizing (`text-xs sm:text-sm`), giving form fields a clean, unobtrusive feel.
- **Log Entry Button**: The "Add Entry" submit button uses single-line whitespace preservation and compact padding for touch screens.

### 3. Polished Navigation & Settings
- **Sleek Mobile Menu**: Active page links now feature soft tile backdrops, rounded icon badges, and clear visual contrast.
- **Settings Page**: Form card headers were streamlined across Profile, Billing, Accounts, and Security tabs to eliminate redundant titles and save vertical space.

### 4. Infrastructure & Domain Routing
- **Automatic 301 Redirect**: Configured a Traefik permanent redirect rule ensuring all traffic to `www.macrotrackr.com` seamlessly redirects to `https://macrotrackr.com/` with preserved paths.
- **Canonical Meta Tags**: Added canonical URL metadata across app entrypoints for improved SEO and search engine indexing.

## Summary

MacroTrackr v2.5 makes daily tracking faster, sleeker, and significantly more comfortable on mobile devices. All 105 test suites and typechecks pass cleanly.
