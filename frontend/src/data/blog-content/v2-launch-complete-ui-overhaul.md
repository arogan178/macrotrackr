# MacroTrackr v2.0: Faster Search, Better Editing, Cleaner Reporting

MacroTrackr v2.0 is the release where the app starts feeling coherent from search to logging to review.

This version is less about one flashy feature and more about removing the small trust-breaking moments that make tracking feel clumsy: search results that feel noisy, quick-add flows that linger after you have already made a choice, grouped meals that are hard to edit confidently, and reporting screens that feel more assembled than designed.

Put together, those fixes change the character of the product.

## What defines v2.0

The through-line for 2.0 is confidence.

You should be able to:

- find a food quickly,
- add it without the interface fighting you,
- come back later and still understand where the numbers came from,
- review your progress without wondering whether the app quietly dropped context on the floor.

That is the standard this release was built around.

## Search is faster and cleaner

Food search now behaves more like a product feature and less like a raw API passthrough.

Results are normalized more consistently, duplicate-looking entries are filtered down, and ranking is better aligned with what people actually expect when they search for a common food. Exact and near-exact matches surface more reliably, while irrelevant or lower-signal matches are pushed down.

On the front end, the search flow was also tightened so result fetching, caching, and empty-state handling follow the same query patterns used elsewhere in the app. That means fewer ad hoc states, clearer loading behavior, and a search box that feels more predictable under repeated use.

## Saved-meal quick add is smoother

One of the most annoying bits of friction in the old flow was that the saved-meals panel could hang around after you had already selected an item. That kind of thing sounds tiny until you repeat it multiple times a day.

In 2.0, the quick-add panel and the search-results panel behave like a single coordinated flow. When you choose a saved meal or a search result, the overlay closes cleanly and the form moves on with the selected data already applied.

That matters because good tracking UX is mostly about not making the user dismiss extra UI they no longer need.

## Grouped meals are easier to trust and edit

Grouped meals now preserve more of the ingredient context needed to stay editable.

If you save a shake made from milk, whey, and a banana, the app keeps the actual quantities and units attached to those ingredients instead of flattening everything into a mysterious total. That makes later edits feel legitimate rather than approximate.

When quantities change, macros are recalculated from a real base amount rather than whatever totals happened to be on screen a moment earlier. That sounds technical, but the user-facing effect is simple: edits feel safer.

## Reporting feels calmer

The reporting layer also got more coherent.

Range controls are easier to read, history handling is clearer, and export behavior better matches user expectations by collecting the full visible history before generating a CSV. Browsing can stay progressive for speed; exports should feel complete.

Date handling and supporting utilities were also cleaned up so labels, ranges, and totals are less likely to drift apart in edge cases.

## Why this release matters

v2.0 is important because it improves trust, not because it adds novelty for novelty’s sake.

A macro tracker only earns a place in someone’s routine if it helps them log quickly, edit confidently, and review progress without second-guessing the data. This release pushes all three of those forward.

## What comes next

The next layer of work is about refinement rather than rescue: stronger saved-meal workflows, smarter educational surfaces, richer exports, and continued cleanup of duplicated front-end logic so the product can move faster without getting messier.

That work is easier now because the foundations are tighter than they were before.

v2.0 is not the finish line. It is the point where MacroTrackr starts behaving like a more reliable system instead of a set of useful but loosely connected features.
