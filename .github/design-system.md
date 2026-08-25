# MacroTrackr UI rules

Read this before writing or changing any UI. It is the rules a model cannot get
by looking at the code — the reasons, the conventions, and the failure modes this
codebase has actually shipped.

It deliberately does **not** restate token values, component props or file
layouts. Those live in the source, and a document that copies them goes stale
and starts lying. Every rule below names the file that owns the truth.

## Drift

**Drift** is the one failure this system is built to prevent: a call site
inventing a value that already exists, or a second implementation of something
that already has one. Every rule here exists because drift shipped.

Two real examples, both fixed, both worth reading before you add UI:

- The **share snapshot** had a React preview and a canvas PNG exporter, each
  computing its own numbers, colours and copy. They disagreed in front of users:
  the preview clamped a macro to `100%` where the PNG printed the true `113%`,
  and fats rendered yellow on screen and rose in the file. Fix:
  `frontend/src/features/macroTracking/utils/macroSnapshot.ts` owns the numbers,
  the palette and the wording; the two renderers only lay out.
- **`/compare`** grew 13 hand-rolled `text-Nxl font-bold` headings and two
  separately written tables, because it was built beside the system instead of
  on it.

When you need something that looks like an existing thing, import the existing
thing. When you need it to differ, change the shared one and let every call site
move together.

## Reach for these

There is one of each. Adding a second is drift.

| Need | Use | Owner |
| --- | --- | --- |
| A card, section, or bordered box | `Panel` | `frontend/src/components/ui/Panel.tsx` |
| Any heading, label, or eyebrow | `Heading` / `TYPE_SCALE` | `frontend/src/components/ui/Heading.tsx` |
| Any number a user reads | `Value` | `frontend/src/components/ui/Value.tsx` |
| Empty, error, or locked state | `StateCard` | `frontend/src/components/ui/StateCard.tsx` |
| Loading placeholder | `Skeleton` | `frontend/src/components/ui/Skeleton.tsx` |
| Entrance animation | `Reveal` | `frontend/src/components/animation/Reveal.tsx` |
| Expand/collapse | `Accordion` | `frontend/src/components/ui/Accordion.tsx` |
| A comparison table | `ComparisonTable` | `frontend/src/features/landing/comparisons/ComparisonTable.tsx` |
| Page chrome and header offset | `PageShell`, `AppHeader` | `frontend/src/components/layout/` |

One exception you will meet immediately: `CardContainer`
(`frontend/src/components/form/CardContainer.tsx`) has 19 call sites to
`Panel`'s 18, and the auth screens are among them. It is not a second card —
its `default` variant *is* `PANEL_CLASS` — but it is a second front door, with
no header, footer or divider grading behind it. Reach for `Panel` in new work.
Its `transparent` variant is the part that genuinely drifted: own radius, own
two durations, and it belongs in `Panel` as a prop or nowhere.

Colour, radius, surface and motion values come from `frontend/src/style.css` and
`frontend/src/styles/global.css`. Write the Tailwind token class (`bg-surface-2`,
`text-muted`, `rounded-card`); a hex literal in a component is drift by
definition.

## Rules with reasons

**Size and width carry hierarchy; weight is nearly flat.** `TYPE_SCALE` has six
steps and stops at `font-semibold` for everything except its two display steps.
Archivo carries a width axis, so display steps run `font-stretch-condensed` and
body copy does not — condensed digits fit more significant places in the same
column, which is the whole reason the font was chosen. Reach for a scale step
before you reach for a weight.

**Depth comes from the four surface steps and two hairlines.** Not from shadows
(`shadows` is a budget pinned at 0 — nothing is darker than `#000` on a
near-black page) and not from a box inside a box. Sections inside a panel are
divided, not bordered: a border says "different thing", a divider says "same
group".

**Dividers are graded, and the grade is information.** 2px `border-border-2`
divides a panel from its header or footer; 1px `border-border` divides rows
inside the body. The heavier rule always means the larger division. `Panel`
exports `RULE_SECTION` and `RULE_HAIRLINE` so you never pick by eye.

**Green means the product.** Primary green is for the brand mark, primary
actions, and live values. Macros have their own three tokens; check
`style.css` for which — do not assume, and do not reuse the brand green for a
macro.

**Animate what changes.** Entrances are opacity-only and go through `Reveal`,
which is the whole vocabulary: three durations and two curves, in `DURATIONS`
and `EASINGS` (`frontend/src/components/utils/UiConstants.ts`). A static number
counting up from zero on every mount is decoration: `AnimatedNumber` is for the
value that actually moves, at most one per screen.

That describes `Reveal`, not yet the whole app: the tree still holds 17 distinct
durations across transitions, timers and one-off variants. The budgets below
carry the real figure, and it is the one to trust.

**Reduced motion has two halves, and CSS is only one of them.** The block at
`frontend/src/styles/global.css:119` zeroes every CSS animation and transition,
which covers each `transition-*` utility for free. It cannot touch motion driven
from JS — `animate()` writing `textContent`, or a `motion` element's inline
transform — because neither is a CSS animation. Anything in that second half
asks for itself, via `usePrefersReducedMotion`. `Reveal`, `PageTransition` and
`AnimatedNumber` do. `AnimatedNumber` did not until its figures were found still
counting under the preference, and the test that now holds it there asserts the
timer never starts, not the value it lands on — the animation lands on the same
figure either way, which is how it went unnoticed.

**Icons carry meaning or they go.** An icon beside a heading that repeats the
heading is decoration. Icon-only controls need `aria-label`.

**A figure has one spelling, and it is grouped.** "2,000 kcal", not "2000
kcal". Every separator in the product comes from `formatGrouped`
(`frontend/src/lib/formatNumber.ts`). Two budgets hold it, both pinned at 0,
because there are two ways to get it wrong: `adHocNumberFormat` catches a call
site reaching for `toLocaleString` itself, and `rawCalorieFigures` catches one
that formats by not formatting — `{tdee} kcal`, which prints "2841 kcal" beside
a "2,841 kcal" two components away. The second is the one that actually shipped,
in eleven places.
The standard is grouped because `Value` always was, and because the type scale
was picked partly to carry it — Archivo's width axis is here so a condensed
"2,140 kcal" fits a 390px column, which is an argument about the grouped form.

It shipped both ways for a while, and the split ran straight through the
primitive that exists to prevent it: `Value` grouped via `toLocaleString`, the
`AnimatedNumber` it delegates to formatted with `toFixed` and did not, so the
same call site changed spelling the moment someone added `animate`. A shared
primitive delegating to a second one that formats differently is the same
failure as two renderers disagreeing — it is just harder to see, because one
prop is the whole reproduction. Changing the standard is one line in that file.

**A number is never clamped to look better.** Clamp the bar — a bar cannot be
longer than its track. Print the real figure beside it. A day over target is
information the user came for.

## Voice

Write like a panel on the back of a packet: state what happened, in the units
the user is working in.

- Say the fact and stop. "Logged 5 of 7 days. 2 days missed." beats "Great job
  keeping up with your tracking!"
- No exclamation marks, no "simply", no emoji, no brochure sentences.
- Claim only what the product does. A comparison table prints the cell and lets
  the reader conclude; it does not stamp a green tick on our own column.
- Say "free" if the tier is free; do not say "100% private" unless something
  enforces it.

## Budgets

`frontend/ui-budgets.json` counts values in the source — radii, surfaces, motion
durations, easings, shadows, hex literals, emoji, `font-bold` outside the scale —
and `bun run lint` fails when one rises. Most count *distinct values* rather than
files on purpose: a call site inventing a value is the drift, and a file-count
budget is blind to it.

Three of them are the residue of drift already found, and are expected to keep
falling: `hexLiterals` (chart series, the native status bar, Google's brand
colours), `boldOutsideScale`, and `smOverrides`. `emoji` is pinned at 0. Two of
those three currently sit *on* their ceiling rather than under it, so the next
call site that adds one fails the build — which is the ratchet working, but read
it as a queue of work rather than as headroom.

The numbers may fall freely. Raising one is a design decision and belongs in the
same commit as the change that needs it, so the trade-off appears in the diff.

**A counter that cannot rise is worse than no counter.** `surfaces` read 2
against a budget of 4 for its whole life, and printed `ratchet this down` the
entire time. Its alternation listed `surface` ahead of `surface-2`, and `-` is a
word boundary, so `bg-surface-2` and `bg-surface-3` both matched as
`bg-surface`: three of the four steps collapsed into one and a fifth surface
would have entered silently. Any alternation whose branches share a prefix runs
longest-first, and a budget sitting well under its ceiling with no memory of
falling is the thing to go and verify.

## What has not moved yet

The rules above are the target, not a description of every file. Knowing where
the system does *not* reach yet matters, because the largest risk to it is a
reader opening a screen that predates it, seeing 24px bold headings and a
hand-rolled card, and copying that as house style. It is not. Counted today:

- **59 hand-rolled `<h1>`–`<h3>` with a `text-Nxl` class, across 30 files**,
  against 14 files on `Heading`. `/compare` and the calculators are migrated;
  most of auth, goals and billing are not.
- **`CardContainer` over `Panel`** in 19 places, including `AuthPageShell` and
  so the whole onboarding flow.
- **83 motion variants that animate `x` or `y`.** Entrances are meant to be
  opacity-only — travel reflows the text underneath it — and `Reveal` is the
  way in. `LandingPage`'s section reveal is one of these.

Two rules for touching any of it. If you are editing a file for another reason,
migrate what you touch and leave the rest; a half-migrated file is fine, an
unattributed restyle in the middle of a bugfix is not. And check the diff for
what it *ratchets*: these three all feed budgets, so real migration shows up as
a number falling in `ui-budgets.json`.

## Before you call UI work done

Each of these is checkable. Run them, do not estimate them.

1. `cd frontend && bun run lint` — zero errors, and every UI budget line reads
   `ok`.
2. `bun run typecheck` and `bun run test` pass.
3. Every colour you wrote is a token class; `grep` your diff for `#` and find
   nothing. If code genuinely needs a colour as a string — a canvas, a
   third-party appearance object — read it with `resolveTokens()` from
   `frontend/src/lib/designTokens.ts` rather than transcribing it.
4. Every heading you wrote goes through `Heading` or `TYPE_SCALE`.
5. Every new card is a `Panel`.
6. Your copy has no exclamation marks and no claim the product cannot back.
7. If you added a second way to render something that already had one, collapse
   it before opening the PR.

## Guarding a fix against regression

Where a defect was structural rather than visual, assert the structure. The
snapshot fix is the pattern to copy
(`frontend/src/features/macroTracking/utils/macroSnapshotParity.test.ts`): it
reads the two renderers' source and fails if either holds a hex literal, derives
a percentage, or carries an emoji. A pixel test would have had to guess which
value diverged next; a structural test fails the moment a renderer starts
deciding for itself again.

## History

`docs/ui-changelog.md` records the passes that built this system, Phase 0
through Phase 9, and why each decision was made. Read it when a rule here looks
arbitrary — the reason is almost certainly there.
