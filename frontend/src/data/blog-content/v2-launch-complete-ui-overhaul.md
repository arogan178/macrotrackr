# MacroTrackr v2.0: Faster Editing, Better Grouping, Cleaner Reporting

MacroTrackr v2.0 is the first release that feels less like a pile of useful tools and more like one product with a clear point of view.

The focus was not on inventing new screens for the sake of it. The focus was on removing the tiny pieces of friction that make tracking feel heavier than it should: editing a saved meal without breaking the math, understanding what actually lives inside a grouped entry, and checking progress without moving through a dashboard that feels stitched together.

That sounds subtle on paper. In daily use, it changes the tone of the app.

## What changed in practice

The biggest shift is that grouped meals now keep enough ingredient context to stay editable.

If you save a shake made from 200ml milk, 30g whey, and a banana, the app now keeps the actual quantities and units attached to those ingredients. It no longer collapses the whole thing into a vague total that looks fine until you try to change one detail later.

That difference matters because trust in a tracker is usually won or lost in the edit flow. If the app cannot explain where the numbers came from, every correction feels risky.

## Edit flow improvements

The rebuilt edit modal follows three simple rules.

### 1. Preserve the source data

Ingredients keep their real quantity and unit whenever possible. Grouped meals also reveal their source ingredients more clearly, so opening a combined meal no longer feels like opening a black box.

### 2. Scale macros from the real base amount

When you change a quantity from 200ml to 300ml, the app recalculates protein, carbs, and fats from the stored base amount instead of guessing from whatever totals happened to be on screen a moment ago.

### 3. Make the modal easier to use for longer meals

Spacing, grouping, and scroll behavior were tightened so longer meals feel manageable instead of bloated. The screen should now hold more ingredients without turning into a stack of giant cards fighting for attention.

## Reporting is lighter and more coherent

The analytics side of the product also became calmer.

Instead of reading like a collection of unrelated widgets, reporting now behaves more like a single workspace. Range controls are easier to notice, empty states are clearer, and the chart panels feel more stable when moving between periods.

Underneath that, the date utilities were consolidated so the app is not mixing local and UTC-style assumptions in different corners of the reporting layer. Most users will never see that change directly, which is exactly the point. It removes the kind of bug that only appears when range boundaries and labels quietly stop agreeing with each other.

## History and export improvements

History browsing still loads progressively because that keeps the interface fast. Exporting, however, now behaves the way users expect. It fetches the full visible history before building the CSV, rather than exporting only the rows that happened to be loaded in the panel.

Browsing can be incremental. Exporting should be complete. That contract is much clearer now.

## Why this release matters

v2.0 matters because it improves product trust, not because it introduces novelty for its own sake.

A tracker only earns a place in someone’s routine if it helps them log quickly, edit confidently, and review progress without second-guessing the data. This release pushes all three of those things forward.

## What comes next

The next layer is less about correction and more about refinement: stronger saved-meal workflows, better educational surfaces, richer exports, and more cleanup of duplicated front-end logic that still slows iteration.

That work is easier now because the foundation is less fragmented than it was a release ago.

v2.0 is not the finish line. It is the point where MacroTrackr starts behaving like a tighter system rather than a collection of useful features.
