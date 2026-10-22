import React, {
  lazy,
  Suspense,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

import Panel from "@/components/ui/Panel";
import Value from "@/components/ui/Value";
import CalorieGauge from "@/features/macroTracking/components/CalorieGauge";
import { HISTORY_ROW_GRID } from "@/features/macroTracking/components/EntryHistoryShared";
import { MacroSplitBar } from "@/features/macroTracking/components/MacroSplitBar";
import TargetRow from "@/features/macroTracking/components/TargetRow";
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

/** Recharts is ~114 KB gzipped, so the weight chart is its own chunk. The
 *  first two scenes need no chart and play for about nine seconds, which is
 *  the window this fetch has to land in. */
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


/** Steps in the logging scene; at this step the day is fully logged. */
export const LOG_SCENE_STEPS = ENTRIES.length;

const MACROS = [
  { key: "protein", label: "Protein", token: "bg-protein" },
  { key: "carbs", label: "Carbs", token: "bg-carbs" },
  { key: "fats", label: "Fats", token: "bg-fats" },
] as const;

/* ── Scene 1: a day being logged ─────────────────────────────────────────── */

// The same rows, gauge and target bars Home draws, so the page shows the app
// rather than a sketch of it.
export function LogScene({ step }: { step: number }) {
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
                HISTORY_ROW_GRID,
                "px-4 transition-all duration-500 ease-out",
                index < shown
                  ? "max-h-20 border-b border-border py-3 opacity-100"
                  : "max-h-0 overflow-hidden py-0 opacity-0",
              )}
            >
              <div className="min-w-0">
                <p className="truncate text-sm">{entry.name}</p>
                <p className="text-xs text-muted">
                  <span className="tabular-nums">{entry.time}</span> {entry.meal}
                </p>
              </div>
              <MacroSplitBar protein={entry.protein} carbs={entry.carbs} fats={entry.fats} />
              <Value
                value={entry.protein * KCAL.protein + entry.carbs * KCAL.carbs + entry.fats * KCAL.fats}
                unit="kcal"
                className="justify-self-end"
              />
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
        <div className="px-4 pt-4 pb-3">
          <Value size="hero" unit="kcal" value={TARGET.calories - calories} />
          <p className="mt-1 text-sm text-muted">
            left of {formatGrouped(TARGET.calories)}
          </p>
          <CalorieGauge
            protein={totals.protein * KCAL.protein}
            carbs={totals.carbs * KCAL.carbs}
            fats={totals.fats * KCAL.fats}
            target={TARGET.calories}
          />
          <Value value={calories} unit="kcal" suffix="eaten" className="mt-3 text-sm" />
        </div>
        <ul className="space-y-5 border-t border-border px-4 py-4">
          {MACROS.map((macro) => (
            <TargetRow
              key={macro.key}
              name={macro.label}
              value={totals[macro.key]}
              target={TARGET[macro.key]}
              unit="g"
              colorClass={macro.token}
            />
          ))}
        </ul>
      </Panel>
    </div>
  );
}

/* ── Scene 2: the week that day lands in ───────────────────────────────── */

const WEEK = [
  { day: "M", calories: 1980, protein: 150, carbs: 205, fats: 64 },
  { day: "T", calories: 2240, protein: 168, carbs: 228, fats: 74 },
  { day: "W", calories: 2105, protein: 171, carbs: 196, fats: 70 },
  { day: "T", calories: 1870, protein: 132, carbs: 190, fats: 64 },
  { day: "F", calories: 2390, protein: 160, carbs: 262, fats: 78 },
  { day: "S", calories: 2510, protein: 141, carbs: 290, fats: 86 },
  { day: "S", calories: 1940, protein: 166, carbs: 180, fats: 63 },
];

const average = (key: keyof Omit<(typeof WEEK)[number], "day">) =>
  Math.round(WEEK.reduce((sum, day) => sum + day[key], 0) / WEEK.length);

// Analytics' summary: each average against its target, with the days under it,
// because a good average over a bad week is a lie told by omission.
export function WeekScene() {
  return (
    <Panel padding="none" className="overflow-hidden">
      <div className="flex items-baseline justify-between px-4 py-3">
        <span className="text-sm font-semibold">This week</span>
        <span className="text-xs text-muted">Daily average over 7 days</span>
      </div>
      <ul className="grid gap-x-8 gap-y-5 border-t border-border px-4 py-4 md:grid-cols-2">
        <TargetRow
          name="Calories"
          value={average("calories")}
          target={TARGET.calories}
          unit="kcal"
          colorClass="bg-primary"
          shortfallLabel="under"
          days={WEEK.map((day) => day.calories)}
        />
        {MACROS.map((macro, index) => (
          <TargetRow
            key={macro.key}
            name={macro.label}
            value={average(macro.key)}
            target={TARGET[macro.key]}
            unit="g"
            colorClass={macro.token}
            shortfallLabel="under"
            days={WEEK.map((day) => day[macro.key])}
            dayLabels={index === MACROS.length - 1 ? WEEK.map((day) => day.day) : undefined}
          />
        ))}
      </ul>
    </Panel>
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
  { key: "week", label: "See the week", steps: 1, hold: 4400, render: WeekScene },
  { key: "goal", label: "Hit the goal", steps: 1, hold: 4400, render: GoalChart },
] as const;

const subscribeToNothing = () => () => {};
const prefersReducedMotion = () =>
  typeof globalThis.matchMedia === "function" &&
  globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches;

const ProductPreview: React.FC = () => {
  const reducedMotion = useSyncExternalStore(
    subscribeToNothing,
    prefersReducedMotion,
    // Hydration starts from the prerendered HTML, which cannot know the
    // visitor's motion preference.
    () => false,
  );

  const [scene, setScene] = useState(0);
  const [stopped, setStopped] = useState(false);
  const [sequenceStep, setSequenceStep] = useState(0);
  const [visible, setVisible] = useState(true);

  const active = SCENES[scene];
  const step = reducedMotion ? active.steps : sequenceStep;

  // Picking a scene stops the sequence, on the same rule the rest of this
  // component follows: an explicit choice is not overridden a moment later.
  const goTo = (index: number) => {
    setStopped(true);
    setScene(index);
    setSequenceStep(SCENES[index].steps);
    setVisible(true);
  };

  useEffect(() => {
    if (reducedMotion || stopped) return;

    // Still filling in: take the next step.
    if (step < active.steps) {
      const timer = setTimeout(() => setSequenceStep((current) => current + 1), STEP_MS);

      return () => clearTimeout(timer);
    }

    // Finished: hold on the completed state, fade out, then hand over.
    const hold = setTimeout(() => setVisible(false), active.hold);
    const handover = setTimeout(() => {
      setScene((current) => (current + 1) % SCENES.length);
      setSequenceStep(0);
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
