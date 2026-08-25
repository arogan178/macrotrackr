import React, { lazy, Suspense, useEffect, useState } from "react";

import Panel from "@/components/ui/Panel";
import { cn } from "@/lib/classnameUtilities";
import { formatGrouped } from "@/lib/formatNumber";

/**
 * The loop, not a screenshot of it.
 *
 * This replaced a tabbed carousel of three static app panels. Three tabs of
 * finished screens asked the reader to imagine the product working, while the
 * headline above claims "log meals in seconds, see where the week went".
 *
 * So it performs that sentence instead, in three scenes that each play through
 * and hand over: a day being logged, the week that day lands in, and the goal
 * the week is moving toward. Each scene animates its own numbers, holds on the
 * finished state long enough to be read, then fades out for the next.
 *
 * Every transition is CSS. No motion library, so this stays out of the
 * animation budget, and `prefers-reduced-motion` shows the first scene finished
 * and still rather than cycling.
 */

/** Recharts is ~114 KB gzipped, so the two chart scenes are their own chunk.
 *  Scene one needs no chart and plays for about four seconds, which is the
 *  window this fetch has to land in. */
const WeekChart = lazy(() =>
  import("./ProductPreviewCharts").then((m) => ({ default: m.WeekChart })),
);
const GoalChart = lazy(() =>
  import("./ProductPreviewCharts").then((m) => ({ default: m.GoalChart })),
);

const ChartFallback = () => (
  <div
    aria-hidden="true"
    className="h-72 rounded-card border border-border bg-surface"
  />
);

const STEP_MS = 850;
const FADE_MS = 450;

const TARGET = { calories: 2200, protein: 165, carbs: 220, fats: 73 };
const KCAL = { protein: 4, carbs: 4, fats: 9 };

const ENTRIES = [
  { name: "Porridge and berries", meal: "Breakfast", time: "07:55", protein: 12, carbs: 62, fats: 9 },
  { name: "Chicken salad bowl", meal: "Lunch", time: "12:40", protein: 48, carbs: 39, fats: 14 },
  { name: "Greek yoghurt", meal: "Snack", time: "16:05", protein: 18, carbs: 9, fats: 4 },
  { name: "Salmon and rice", meal: "Dinner", time: "19:20", protein: 42, carbs: 58, fats: 11 },
];


const MACROS = [
  { key: "protein", label: "Protein", token: "bg-protein" },
  { key: "carbs", label: "Carbs", token: "bg-carbs" },
  { key: "fats", label: "Fats", token: "bg-fats" },
] as const;

/* ── Scene 1: a day being logged ─────────────────────────────────────────── */

function LogScene({ step }: { step: number }) {
  const shown = Math.min(step, ENTRIES.length);
  const totals = ENTRIES.slice(0, shown).reduce(
    (sum, entry) => ({
      protein: sum.protein + entry.protein,
      carbs: sum.carbs + entry.carbs,
      fats: sum.fats + entry.fats,
    }),
    { protein: 0, carbs: 0, fats: 0 },
  );
  const calories =
    totals.protein * KCAL.protein +
    totals.carbs * KCAL.carbs +
    totals.fats * KCAL.fats;

  return (
    <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
      <Panel padding="none" className="overflow-hidden">
        <div className="flex items-baseline justify-between px-4 py-3">
          <span className="text-sm font-semibold">Today</span>
          <span className="text-xs text-muted tabular-nums">
            {shown} {shown === 1 ? "entry" : "entries"}
          </span>
        </div>
        <div className="border-t border-border">
          {ENTRIES.map((entry, index) => (
            <div
              key={entry.name}
              aria-hidden={index >= shown}
              className={cn(
                "flex items-center justify-between gap-3 px-4 transition-all duration-500 ease-out",
                index < shown
                  ? "max-h-20 border-b border-border py-3 opacity-100"
                  : "max-h-0 overflow-hidden py-0 opacity-0",
              )}
            >
              <div className="min-w-0">
                <p className="truncate text-sm">{entry.name}</p>
                <p className="text-xs text-muted">
                  {entry.meal}, {entry.time}
                </p>
              </div>
              <p className="shrink-0 text-xs text-muted tabular-nums">
                {entry.protein} / {entry.carbs} / {entry.fats}
              </p>
            </div>
          ))}
        </div>
        <p className="px-4 py-3 text-xs text-muted">
          {shown < ENTRIES.length
            ? "Logging a day"
            : "Four meals, about twenty seconds of typing."}
        </p>
      </Panel>

      <Panel padding="none" className="overflow-hidden">
        <div className="px-4 py-4">
          <p className="text-xs font-medium tracking-wider text-muted uppercase">
            Calories
          </p>
          <p className="mt-1 flex items-baseline gap-1.5">
            <span className="text-4xl font-light tracking-tight tabular-nums">
              {formatGrouped(calories)}
            </span>
            <span className="text-sm text-muted">
              of {formatGrouped(TARGET.calories)}
            </span>
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-3">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
              style={{
                width: `${Math.min(100, (calories / TARGET.calories) * 100)}%`,
              }}
            />
          </div>
        </div>
        <div className="grid gap-3 border-t border-border px-4 py-4">
          {MACROS.map((macro) => (
            <div key={macro.key}>
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="flex items-center gap-2 text-xs">
                  <span className={cn("h-1.5 w-1.5 rounded-full", macro.token)} />
                  {macro.label}
                </span>
                <span className="text-xs text-muted tabular-nums">
                  <span className="text-foreground">{totals[macro.key]}</span> /{" "}
                  {TARGET[macro.key]} g
                </span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-surface-3">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-500 ease-out",
                    macro.token,
                  )}
                  style={{
                    width: `${Math.min(100, (totals[macro.key] / TARGET[macro.key]) * 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* ── The sequence ────────────────────────────────────────────────────────── */

/**
 * `steps` is how many times the scene advances before it is complete, and
 * `hold` is how long the finished state stays up.
 *
 * The chart scenes take a single step, handing Recharts the whole series at
 * once so its own draw-in animation runs. Feeding them a point at a time
 * restarted that animation on every tick and then cut away mid-draw. They also
 * hold longer, because the line has to finish drawing before the reader has
 * seen anything at all.
 */
const SCENES = [
  { key: "log", label: "Log a day", steps: ENTRIES.length, hold: 2600, render: LogScene },
  { key: "week", label: "See the week", steps: 1, hold: 4400, render: WeekChart },
  { key: "goal", label: "Hit the goal", steps: 1, hold: 4400, render: GoalChart },
] as const;

const ProductPreview: React.FC = () => {
  const reducedMotion =
    typeof globalThis.matchMedia === "function" &&
    globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const [scene, setScene] = useState(0);
  const [stopped, setStopped] = useState(false);
  const [step, setStep] = useState(reducedMotion ? SCENES[0].steps : 0);
  const [visible, setVisible] = useState(true);

  const active = SCENES[scene];

  // Picking a scene stops the sequence, on the same rule the rest of this
  // component follows: an explicit choice is not overridden a moment later.
  const goTo = (index: number) => {
    setStopped(true);
    setScene(index);
    setStep(SCENES[index].steps);
    setVisible(true);
  };

  useEffect(() => {
    if (reducedMotion || stopped) return;

    // Still filling in: take the next step.
    if (step < active.steps) {
      const timer = setTimeout(() => setStep((current) => current + 1), STEP_MS);

      return () => clearTimeout(timer);
    }

    // Finished: hold on the completed state, fade out, then hand over.
    const hold = setTimeout(() => setVisible(false), active.hold);
    const handover = setTimeout(() => {
      setScene((current) => (current + 1) % SCENES.length);
      setStep(0);
      setVisible(true);
    }, active.hold + FADE_MS);

    return () => {
      clearTimeout(hold);
      clearTimeout(handover);
    };
  }, [step, active.steps, active.hold, reducedMotion, stopped]);

  const Scene = active.render;

  return (
    <div className="mx-auto w-full max-w-4xl text-left select-none">
      <div
        className="transition-opacity ease-out"
        style={{ opacity: visible ? 1 : 0, transitionDuration: `${FADE_MS}ms` }}
      >
        <Suspense fallback={<ChartFallback />}>
          <Scene step={step} />
        </Suspense>
      </div>

      {/* The label used to sit to the right of the dots, which pushed the pair
          off centre and left the reader unsure which of the two the label
          belonged to. Dots centred, label centred beneath, and each dot is a
          real button: the scenes were only ever watchable in order. */}
      <div className="mt-5 flex flex-col items-center gap-2">
        <div
          role="tablist"
          aria-label="Product preview"
          className="flex items-center justify-center"
        >
          {SCENES.map((item, index) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={index === scene}
              aria-label={item.label}
              tabIndex={index === scene ? 0 : -1}
              onClick={() => goTo(index)}
              className="group flex min-h-11 cursor-pointer items-center px-1.5 focus-visible:outline-none"
            >
              <span
                className={cn(
                  "h-1 rounded-full transition-all duration-300",
                  "group-focus-visible:ring-2 group-focus-visible:ring-primary group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-background",
                  index === scene
                    ? "w-6 bg-primary"
                    : "w-2 bg-surface-3 group-hover:bg-border-2",
                )}
              />
            </button>
          ))}
        </div>
        <span className="text-xs text-muted">{active.label}</span>
      </div>
    </div>
  );
};

export default ProductPreview;
