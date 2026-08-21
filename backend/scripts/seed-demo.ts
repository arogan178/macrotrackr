// scripts/seed-demo.ts
//
// Builds a demo database for marketing capture (screenshots, launch video).
//
// It never writes to the dev database. It copies DATABASE_PATH to
// DEMO_DATABASE_PATH, wipes the demo user's rows, and refills them with a
// plausible eight weeks of tracking. Every number is generated from a fixed
// seed, so two runs produce identical screens and a re-render never silently
// changes the numbers burnt into a video.
//
//   bun run scripts/seed-demo.ts
//
// Then point the backend at the copy:
//   DATABASE_PATH=./macro_tracker.demo.db bun run dev

import { Database } from "bun:sqlite";
import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

import { initializeSchema } from "../src/db/schema";

const SOURCE_DB = process.env.DATABASE_PATH ?? "./macro_tracker.db";
const DEMO_DB = process.env.DEMO_DATABASE_PATH ?? "./macro_tracker.demo.db";

// The Clerk test user the e2e suite already signs in as, so Playwright can
// reach these screens without a new account.
const DEMO_EMAIL = process.env.DEMO_EMAIL ?? "test+clerk_test@example.com";

// The home screen greets by first name, and this is the founder's own launch,
// so the demo profile carries a real name rather than an invented persona.
const DEMO_FIRST_NAME = process.env.DEMO_FIRST_NAME ?? "Andrea";
const DEMO_LAST_NAME = process.env.DEMO_LAST_NAME ?? "Bugeja";

// Capture is pinned to a fixed "today" so the video's dates never drift.
const TODAY = process.env.DEMO_TODAY ?? "2026-08-20";

const DAYS = 56;
const CALORIE_TARGET = 2150;
const SPLIT = { protein: 30, carbs: 40, fats: 30 };

// Deterministic PRNG (mulberry32). Math.random would make every run produce
// different screens, which breaks frame-by-frame video review.
function makeRandom(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = makeRandom(20260820);

function jitter(value: number, spread: number): number {
  return value * (1 + (random() * 2 - 1) * spread);
}

function dateMinus(days: number): string {
  const base = new Date(`${TODAY}T00:00:00Z`);
  base.setUTCDate(base.getUTCDate() - days);
  return base.toISOString().slice(0, 10);
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

// Real foods with real macros. Invented labels are the fastest way to make a
// launch video look fake, so these read like an actual log.
type Meal = {
  name: string;
  type: "breakfast" | "lunch" | "dinner" | "snack";
  protein: number;
  carbs: number;
  fats: number;
  time: string;
};

const BREAKFASTS: Meal[] = [
  { name: "Greek yoghurt, berries & honey", type: "breakfast", protein: 24, carbs: 38, fats: 6, time: "07:40" },
  { name: "Scrambled eggs on sourdough", type: "breakfast", protein: 27, carbs: 34, fats: 19, time: "08:10" },
  { name: "Overnight oats with peanut butter", type: "breakfast", protein: 21, carbs: 55, fats: 16, time: "07:25" },
  { name: "Protein smoothie & banana", type: "breakfast", protein: 32, carbs: 44, fats: 5, time: "08:35" },
  { name: "Ftira with tuna and tomato", type: "breakfast", protein: 29, carbs: 48, fats: 12, time: "09:00" },
];

const LUNCHES: Meal[] = [
  { name: "Chicken and rice bowl", type: "lunch", protein: 46, carbs: 62, fats: 11, time: "13:00" },
  { name: "Tuna salad wrap", type: "lunch", protein: 38, carbs: 41, fats: 14, time: "12:40" },
  { name: "Leftover bolognese", type: "lunch", protein: 35, carbs: 58, fats: 18, time: "13:20" },
  { name: "Falafel and hummus plate", type: "lunch", protein: 22, carbs: 64, fats: 21, time: "12:55" },
  { name: "Salmon poke bowl", type: "lunch", protein: 41, carbs: 57, fats: 17, time: "13:10" },
  { name: "Grilled halloumi salad", type: "lunch", protein: 26, carbs: 22, fats: 28, time: "12:30" },
];

const DINNERS: Meal[] = [
  { name: "Steak, potatoes & greens", type: "dinner", protein: 52, carbs: 48, fats: 22, time: "19:45" },
  { name: "Salmon with sweet potato", type: "dinner", protein: 44, carbs: 46, fats: 20, time: "20:10" },
  { name: "Chicken curry and rice", type: "dinner", protein: 43, carbs: 71, fats: 16, time: "20:30" },
  { name: "Pasta with prawns", type: "dinner", protein: 36, carbs: 79, fats: 13, time: "19:55" },
  { name: "Turkey chilli", type: "dinner", protein: 47, carbs: 44, fats: 14, time: "19:30" },
  { name: "Rabbit stew and bread", type: "dinner", protein: 49, carbs: 52, fats: 24, time: "20:45" },
];

const SNACKS: Meal[] = [
  { name: "Whey shake", type: "snack", protein: 25, carbs: 4, fats: 2, time: "16:30" },
  { name: "Apple and almonds", type: "snack", protein: 6, carbs: 26, fats: 14, time: "16:00" },
  { name: "Cottage cheese and crackers", type: "snack", protein: 18, carbs: 22, fats: 5, time: "21:30" },
  { name: "Dark chocolate, two squares", type: "snack", protein: 2, carbs: 13, fats: 9, time: "21:50" },
  { name: "Protein bar", type: "snack", protein: 20, carbs: 24, fats: 8, time: "15:40" },
];

const SAVED_MEALS: Meal[] = [
  { name: "Chicken and rice bowl", type: "lunch", protein: 46, carbs: 62, fats: 11, time: "13:00" },
  { name: "Greek yoghurt, berries & honey", type: "breakfast", protein: 24, carbs: 38, fats: 6, time: "07:40" },
  { name: "Whey shake", type: "snack", protein: 25, carbs: 4, fats: 2, time: "16:30" },
  { name: "Salmon with sweet potato", type: "dinner", protein: 44, carbs: 46, fats: 20, time: "20:10" },
];

// accent_color is a palette name, not a semantic token. The DB CHECK was
// removed and the API validates instead, so a wrong value here fails the whole
// habits response and takes the Goals page down with it.
const HABITS = [
  { title: "Hit protein target", icon: "drumstick", target: 7, current: 6, accent: "green" },
  { title: "Water, 2L", icon: "droplet", target: 8, current: 8, accent: "cyan" },
  { title: "Log every meal", icon: "notebook", target: 7, current: 7, accent: "lime" },
  { title: "Train", icon: "dumbbell", target: 4, current: 3, accent: "orange" },
];

function pick<T>(items: T[]): T {
  return items[Math.floor(random() * items.length)]!;
}

function main() {
  const sourcePath = resolve(SOURCE_DB);
  if (!existsSync(sourcePath)) {
    console.error(`Source database not found: ${sourcePath}`);
    process.exit(1);
  }

  const demoPath = resolve(DEMO_DB);
  copyFileSync(sourcePath, demoPath);
  console.log(`Copied ${sourcePath} -> ${demoPath}`);

  const db = new Database(demoPath);
  db.exec("PRAGMA foreign_keys = ON");

  // The dev database can be older than the current schema (it predated the
  // subscriptions `provider` column). Run the app's own migrations on the copy
  // rather than hand-rolling DDL that would then drift from schema.ts.
  initializeSchema(db);

  const user = db
    .query<{ id: number }, [string]>("SELECT id FROM users WHERE email = ?")
    .get(DEMO_EMAIL);

  if (!user) {
    console.error(`Demo user not found: ${DEMO_EMAIL}`);
    process.exit(1);
  }
  const userId = user.id;

  // Every other account's rows are dropped, so a stray screenshot can never
  // leak a real user's food log into marketing material.
  db.transaction(() => {
    for (const table of [
      "macro_entries",
      "weight_log",
      "habits",
      "saved_meals",
      "subscriptions",
      "weight_goals",
      "macro_targets",
      "user_details",
    ]) {
      db.exec(`DELETE FROM ${table}`);
    }
    db.run("DELETE FROM users WHERE id != ?", [userId]);
    db.run(
      "UPDATE users SET first_name = ?, last_name = ?, subscription_status = 'pro' WHERE id = ?",
      [DEMO_FIRST_NAME, DEMO_LAST_NAME, userId],
    );
  })();

  const startWeight = 84.2;
  const targetWeight = 76;

  db.transaction(() => {
    db.run(
      `INSERT INTO user_details (user_id, date_of_birth, height, weight, gender, activity_level, switching_source)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, "1993-04-12", 179, round1(startWeight - 5.1), "male", 3, "myfitnesspal"],
    );

    db.run(
      `INSERT INTO macro_targets (user_id, protein_percentage, carbs_percentage, fats_percentage, locked_macros)
       VALUES (?, ?, ?, ?, '["protein"]')`,
      [userId, SPLIT.protein, SPLIT.carbs, SPLIT.fats],
    );

    db.run(
      `INSERT INTO weight_goals
         (user_id, starting_weight, target_weight, weight_goal, start_date, target_date,
          calorie_target, calculated_weeks, weekly_change, daily_change)
       VALUES (?, ?, ?, 'lose', ?, ?, ?, ?, ?, ?)`,
      [userId, startWeight, targetWeight, dateMinus(DAYS), dateMinus(-42), CALORIE_TARGET, 14, -0.55, -430],
    );

    // Weekly weigh-ins: a real cut, so it stalls once instead of drawing a
    // suspiciously straight line.
    for (let week = 0; week <= 8; week += 1) {
      const day = DAYS - week * 7;
      const stall = week === 5 ? 0.35 : 0;
      const weight = startWeight - week * 0.62 + stall + (random() * 0.3 - 0.15);
      db.run(
        "INSERT INTO weight_log (id, user_id, timestamp, weight) VALUES (?, ?, ?, ?)",
        [`demo-weigh-${week}`, userId, dateMinus(Math.max(day, 0)), round1(weight)],
      );
    }

    for (const meal of SAVED_MEALS) {
      db.run(
        "INSERT INTO saved_meals (user_id, name, protein, carbs, fats, meal_type) VALUES (?, ?, ?, ?, ?, ?)",
        [userId, meal.name, meal.protein, meal.carbs, meal.fats, meal.type],
      );
    }

    const nowIso = `${TODAY}T09:00:00.000Z`;
    for (const [index, habit] of HABITS.entries()) {
      const complete = habit.current >= habit.target;
      db.run(
        `INSERT INTO habits (id, user_id, title, icon_name, current, target, accent_color, is_complete, created_at, completed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `demo-habit-${index}`,
          userId,
          habit.title,
          habit.icon,
          habit.current,
          habit.target,
          habit.accent,
          complete ? 1 : 0,
          nowIso,
          complete ? nowIso : null,
        ],
      );
    }

    // Pro via Google Play, which is what this launch is actually about.
    db.run(
      `INSERT INTO subscriptions (id, user_id, provider, provider_subscription_id, status, current_period_end)
       VALUES (?, ?, 'play', ?, 'active', ?)`,
      ["demo-sub-play", userId, "demo-play-purchase-token", `${dateMinus(-23)}T00:00:00.000Z`],
    );

    let entryCount = 0;
    for (let dayOffset = DAYS; dayOffset >= 0; dayOffset -= 1) {
      const entryDate = dateMinus(dayOffset);

      // Two skipped days, because nobody logs 56 for 56 and a perfect streak
      // reads as fabricated.
      if (dayOffset === 31 || dayOffset === 12) continue;

      const meals: Meal[] = [pick(BREAKFASTS), pick(LUNCHES)];
      // Today is captured mid-afternoon: breakfast, lunch and a snack in,
      // dinner still to come. That leaves the rings partly filled, which is a
      // far better screenshot than a finished day.
      if (dayOffset > 0) meals.push(pick(DINNERS));
      if (random() > 0.25) meals.push(pick(SNACKS));
      if (dayOffset === 0) meals.push(SNACKS[0]!);

      for (const meal of meals) {
        db.run(
          `INSERT INTO macro_entries (user_id, protein, carbs, fats, meal_type, meal_name, entry_date, entry_time)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            round1(jitter(meal.protein, 0.08)),
            round1(jitter(meal.carbs, 0.1)),
            round1(jitter(meal.fats, 0.12)),
            meal.type,
            meal.name,
            entryDate,
            `${meal.time}:00`,
          ],
        );
        entryCount += 1;
      }
    }

    console.log(`Seeded ${entryCount} entries across ${DAYS + 1} days`);
  })();

  const today = db
    .query<{ kcal: number; n: number }, [number, string]>(
      `SELECT ROUND(SUM(protein * 4 + carbs * 4 + fats * 9)) AS kcal, COUNT(*) AS n
       FROM macro_entries WHERE user_id = ? AND entry_date = ?`,
    )
    .get(userId, TODAY);

  console.log(
    `Today (${TODAY}): ${today?.n ?? 0} entries, ${today?.kcal ?? 0} kcal of ${CALORIE_TARGET}`,
  );
  console.log(`Demo user: ${DEMO_EMAIL} (id ${userId}), Pro via Play`);
  db.close();
}

main();
