# UI changelog

The UI plan (`ui-polish-plan.html`) is a living document, not a one-off review.
Each pass ticks its rows there and adds a line here, so the "current" column
stays honest instead of becoming a museum of decisions already shipped.

Numbers are counted from the source by `bun run ui:budgets`
(`frontend/scripts/check-ui-budgets.mjs`), which fails the build when one of
them rises.

## Phase 0 — bugs that were invisible

- Undefined Tailwind tokens (`text-muted-foreground`, `text-primary-foreground`,
  bare `blue`, `success-500`, `error-500`) rendered as inherited colour rather
  than failing. Blog excerpts and 404 copy were white where they should have
  been grey. A test now walks the source for colour utilities that do not
  resolve.
- `/tools/*` and `/blog/*` gave a signed-in user two stacked fixed headers.
- The public and auth headers had no safe-area offset, so they sat under the
  status bar in the Capacitor build.
- `viewport-fit=cover` was missing, so `env(safe-area-inset-*)` reported 0 and
  the whole `--sat`/`--sab` system was dead.
- The installed app tinted its chrome indigo and flashed two other colours on
  launch. One chrome colour now: `#000000`.
- Removed: five shadow tokens defined as `none` and their call sites, an
  always-empty div, the inert v3 `tailwind.config.js`, and `src/theme` (a
  Material 3 mapping and a duplicate `COLOR_MAP` nothing imported).

## Phase 1 — the closed token set and the shell

- Four opaque surfaces, two hairlines, three radii. ~20 alpha surface variants
  and 12 hairline colours mapped onto them by codemod; `backdrop-blur` removed
  everywhere except the two real overlays.
- One `AppHeader` with `app | public | minimal` modes replaces four separate
  bars, and `PageShell` owns the offset via `--header-offset` — pages had been
  guessing with `pt-24`, `pt-28`, `pt-32`, `pt-40` and a spacer div.
- `MobileNavSheet` gives the public pages a mobile route to Tools, Blog and
  Docs, which they previously did not have at all.
- `Panel` and `Heading` are the one card and the one type scale (18 distinct
  `<h2>` class strings before).
- `BUTTON_SIZES` carries the 44px touch minimum instead of a dozen call sites
  hand-writing `min-h-11`.

## Phase 2 — one of each shared thing

- Shared `TabBar` on Goals and Settings; `StateCard` and `Skeleton` replace
  seven state treatments and four skeleton files; the two `MetricCard`s merge;
  one `PageTransition` (cross-fade, no travel) and one `Accordion`.

## Phase 3 — page passes

- Home leads with the day: one panel split by dividers instead of six boxes,
  one animated number instead of fourteen.
- Analytics: a locked range offers the upgrade instead of silently doing
  nothing.
- Settings: the unsaved badge and the save button are one docked object.
- `/pricing` is public; `PricingTable`, a third description of the same plans,
  is deleted.
- The landing hero has one primary CTA and proves the product with the real
  Home panel.
- `PageBackground` is hoisted to `MainLayout`: one instance, not one per
  navigation.

## Phase 4 — responsive, fonts, delivery

- The missing `md:` layer: 640–1024px was a stretched phone.
- Inter is self-hosted (one variable woff2, precached); the 583 KB icon preload
  is gone.
- Update-available prompt, offline bar, manifest `id`/shortcuts/apple meta,
  `100dvh`, and `user-select` scoped to coarse pointers.

## Phase 5 — mobile structure

- `MobileTabBar` with a Log sheet: the four destinations leave the top-right
  hamburger, and logging a meal stops needing a scroll.
- `Modal` becomes a bottom sheet below `md`.
- Entry rows drop from ~200px to ~116px.
- Offline refresh works on every route, not just `/`.

## Phase 6 — identity

- One name, one lockup: the mark carries the colour, the word is foreground.
- The mark is redrawn as flat SVG that reads at 16px, with a separate maskable
  tile.
- Green means the product only. Macros take violet, blue and orange — no macro
  is the brand colour, and fats no longer share a hue with error red.
- `<Value>`: one number treatment, rounding decided by unit.
- Voice: no exclamation marks, no "simply", no brochure sentences.

## Phase 7 — keeping it

- `ui-budgets.json` + `scripts/check-ui-budgets.mjs`, wired into `bun run lint`.
  The numbers may fall freely; raising one requires editing the budget file in
  the same change, which puts the trade-off in the diff.

## Phase 8 — motion, measured

- The motion budget counted files importing `motion/react` and asked for 20.
  Wrong instrument: every other budget counts *distinct values*, because a call
  site inventing a value is the drift. Counted directly, motion had 23
  durations, 9 ease spellings, 55 hand-written `initial`/`animate` triples
  across 27 files, `scale` from 0.8 to 1.5 against a documented 2% ceiling, and
  2 of 43 files honouring `prefers-reduced-motion`.
- Proof the old budget was blind: removing ten hand-written animations moved
  `motionFiles` from 43 to 43.
- `DURATIONS` and `EASINGS` join the other tokens — three durations, two curves.
  `<Reveal>` gives call sites a named intent instead of numbers, opacity-only,
  with stagger as an ordinal step.
- Deleted the two animations phase 2 asked for and never got: `ReportingPage`'s
  per-card travel plus `layout`, and `EntryCard`'s `layout` inside the
  virtualized list. `EntryHistoryPanel` went from seven declarations to one.
- New budgets: `motionDurations`, `motionEasings`, `motionCallSites`,
  `layoutProjection`. `motionFiles` stays as a loose backstop only.

## Phase 9 — an identity of its own

- The palette was Spotify's, value for value: `#1ed760` over `#121212` /
  `#181818` / `#282828` with `#b3b3b3` text. Phase 6.4 spotted the green,
  called it "optional and reversible in one line", and never shipped; the
  green was never the main problem, the whole ramp was lifted.
- Green stays — a saturated accent earns its keep on a near-black page, which
  is why it was reached for. The hue moves: `#4ad435`, hue 112° against
  Spotify's 141°, luminance matched (10.8:1 vs 10.9:1) so it carries the same
  weight in the same places. Surfaces warm a few points off neutral so a
  yellow-green accent reads as printed stock rather than screen grey.
- Inter out, **Archivo** in — one variable file, but carrying a width axis.
  The product is a nutrition panel: four numbers converging on four targets,
  read at arm's length. Panels solve that with condensed grotesque figures,
  which is a measurement decision before a stylistic one — condensed digits fit
  more significant places in the same column, and at 390px three macro values
  share ~108px each. Display, page and micro steps run condensed; body copy
  does not. Costs 42 KB over Inter, precached.
- Panel dividers are graded, and the grade is information: 2px strong rule for
  header/footer divisions, 1px hairline for rows inside. Checked at 390px —
  the first value for the strong rule was invisible, so `--color-border-2`
  moved from `#3b3733` to `#55504a`.
- Icons regenerated in the new green; `mark.svg`, chart constants, the Remotion
  hero and `TrendDisplay` no longer carry hardcoded old hexes.

## Next

Horizons from the plan's "How it grows" tab, deliberately not started: a charts
identity pass, a shareable day card, onboarding as a first run of the real UI,
launcher widgets, and a density preference.
