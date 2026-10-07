import { readFileSync, writeFileSync } from "node:fs";

import { type Browser, chromium, type Locator, type Page } from "@playwright/test";
import { clerk, clerkSetup } from "@clerk/testing/playwright";
import dotenv from "dotenv";

dotenv.config({ path: new URL("../../.env.test", import.meta.url).pathname, quiet: true });
const appUrl = process.env.PROFILE_URL ?? "http://localhost:5312";
const apiUrl = process.env.PROFILE_API_URL ?? "http://localhost:3312";
const email = process.env.E2E_CLERK_USER_EMAIL!;
const cpuThrottle = 4;

type Stats = { commits: number; renders: number; renderMs: number; byComponent: Record<string, number> };
type Run = Stats & { timings: Record<string, number> };
type Prof = { reset: () => void; read: () => Stats; lastCommit: number };

// Runs in the page before the app. Counts commits on the app's root and the
// components that rendered in each, the way React DevTools decides it.
function installProfiler() {
  const composite = new Set([0, 1, 11, 15]); // function, class, forwardRef, simple memo
  let stats: Stats;
  const prof = {
    lastCommit: 0,
    reset() {
      stats = { commits: 0, renders: 0, renderMs: 0, byComponent: {} };
    },
    read: () => stats,
  };
  prof.reset();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const visit = (fiber: any) => {
    const previous = fiber.alternate;
    if (composite.has(fiber.tag) && (!previous || fiber.flags & 1)) {
      const type = fiber.tag === 11 ? fiber.type.render : fiber.type;
      const name = fiber.type.displayName || type.displayName || type.name || "Anonymous";
      stats.renders += 1;
      stats.byComponent[name] = (stats.byComponent[name] ?? 0) + 1;
    }
    // A subtree React bailed out of keeps its old child, and its flags are stale.
    if (previous && previous.child === fiber.child) return;
    for (let child = fiber.child; child; child = child.sibling) visit(child);
  };
  Object.assign(window, {
    __prof: prof,
    __REACT_DEVTOOLS_GLOBAL_HOOK__: {
      supportsFiber: true,
      renderers: new Map(),
      inject(renderer: unknown) {
        this.renderers.set(this.renderers.size + 1, renderer);

        return this.renderers.size;
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onCommitFiberRoot(_id: number, root: any) {
        // Clerk mounts its own React roots; only the app's counts.
        if (root.containerInfo?.id !== "root") return;
        stats.commits += 1;
        stats.renderMs += root.current.actualDuration ?? 0;
        prof.lastCommit = performance.now();
        visit(root.current);
      },
      onCommitFiberUnmount() {},
      onPostCommitFiberRoot() {},
      checkDCE() {},
    },
  });
}

const prof = (page: Page) => ({
  reset: () => page.evaluate(() => (window as unknown as { __prof: Prof }).__prof.reset()),
  read: () => page.evaluate(() => (window as unknown as { __prof: Prof }).__prof.read()),
  // Waits until React has not committed for `quietMs`.
  settle: (quietMs = 500) =>
    page.evaluate(
      (quiet) =>
        new Promise<void>((resolve, reject) => {
          const { __prof } = window as unknown as { __prof: Prof };
          const start = performance.now();
          const check = () => {
            const now = performance.now();
            if (now - __prof.lastCommit >= quiet) resolve();
            else if (now - start > 20_000) reject(new Error("React kept committing for 20s"));
            else setTimeout(check, 50);
          };
          check();
        }),
      quietMs,
    ),
});

// Clicks inside the page and returns the milliseconds until the first frame
// in which the element matching `within` contains `text`.
function timedClick(target: Locator, text: string, within = "body") {
  return target.evaluate(
    (element, { expected, scope }) =>
      new Promise<number>((resolve, reject) => {
        const start = performance.now();
        const tick = () => {
          if (document.querySelector(scope)?.textContent?.includes(expected)) resolve(performance.now() - start);
          else if (performance.now() - start > 20_000) reject(new Error(`"${expected}" never appeared`));
          else requestAnimationFrame(tick);
        };
        (element as HTMLElement).click();
        requestAnimationFrame(tick);
      }),
    { expected: text, scope: within },
  );
}

async function signIn(page: Page) {
  await page.goto(`${appUrl}/login`);
  await clerk.signIn({ page, emailAddress: email });
}

async function newPage(browser: Browser, mobile: boolean) {
  const context = await browser.newContext(
    mobile ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 800 } },
  );
  await context.addInitScript(installProfiler);
  const page = await context.newPage();
  page.on("pageerror", (error) => console.error("page error:", error.message));
  page.on("console", (message) => {
    if (message.type() === "error") console.error("console error:", message.text());
  });
  await signIn(page);
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpuThrottle });

  return page;
}

async function openSettled(page: Page, path: string, text: string) {
  await page.goto(`${appUrl}${path}`);
  await page.getByText(text).first().waitFor();
  await prof(page).settle();
  await prof(page).reset();
}

const scenarios: Record<string, { mobile: boolean; run: (page: Page, iteration: number) => Promise<Record<string, number>> }> = {
  // The add-entry sheet from the tab bar, typed the way a person types.
  "log entry": {
    mobile: true,
    async run(page, iteration) {
      await openSettled(page, "/home", "Entry History");
      const name = `Profiled meal ${iteration}`;
      // Home keeps a hidden copy of the form for wider screens, so look inside the sheet.
      const open = await timedClick(page.getByRole("button", { name: "Log a meal" }), "Total Calories", "[role=dialog]");
      // Typing before the sheet settles loses keystrokes to its late renders.
      await prof(page).settle();
      const sheet = page.getByRole("dialog", { name: "Log a meal" });
      await sheet.getByPlaceholder("e.g. Chicken Salad").pressSequentially(name);
      for (const [index, value] of ["32", "45", "12"].entries()) {
        const field = sheet.getByRole("spinbutton").nth(index + 1);
        await field.fill("");
        await field.pressSequentially(value);
      }
      const addEntry = sheet.getByRole("button", { name: "Add Entry", disabled: false });
      await addEntry.waitFor();
      const save = await timedClick(addEntry, name);
      await prof(page).settle();

      return { "open sheet": open, save };
    },
  },
  "edit entry": {
    mobile: true,
    async run(page, iteration) {
      await openSettled(page, "/home", "Entry History");
      const open = await timedClick(page.getByRole("button", { name: "Edit entry" }).first(), "Edit Nutrition Entry", "[role=dialog]");
      await prof(page).settle();
      const dialog = page.getByRole("dialog", { name: "Edit Nutrition Entry" });
      const name = `Edited meal ${iteration}`;
      await dialog.getByLabel("Food Name").fill("");
      await dialog.getByLabel("Food Name").pressSequentially(name);
      await dialog.getByLabel("Protein (g)").fill("");
      await dialog.getByLabel("Protein (g)").pressSequentially("40");
      const saveButton = dialog.getByRole("button", { name: "Save", exact: true, disabled: false });
      await saveButton.waitFor();
      const save = await timedClick(saveButton, name);
      await prof(page).settle();

      return { "open edit": open, save };
    },
  },
  // Client-side navigation into the dashboard from Analytics.
  home: {
    mobile: false,
    async run(page) {
      await openSettled(page, "/reporting", "Macro Distribution");
      const navigate = await timedClick(page.getByRole("button", { name: "Home", exact: true }), "Entry History");
      await prof(page).settle();

      return { navigate };
    },
  },
  "reporting ranges": {
    mobile: false,
    async run(page) {
      await openSettled(page, "/reporting", "Macro Distribution");
      const timings: Record<string, number> = {};
      for (const [tab, text] of [
        ["30 Days", "of 30 days."],
        ["90 Days", "of 90 days."],
        ["7 Days", "7 tracked days"],
      ]) {
        timings[tab] = await timedClick(page.getByRole("tab", { name: tab }), text);
        await prof(page).settle();
      }

      return timings;
    },
  },
};

async function measure(browser: Browser, runs: number, outFile: string) {
  const results: Record<string, Run[]> = {};
  const only = process.env.PROFILE_ONLY;
  for (const [name, scenario] of Object.entries(scenarios)) {
    if (only && name !== only) continue;
    const page = await newPage(browser, scenario.mobile);
    results[name] = [];
    try {
      // One discarded pass loads every lazy chunk the scenario touches.
      await scenario.run(page, 0);
      for (let iteration = 1; iteration <= runs; iteration++) {
        console.error(`${name} ${iteration}/${runs}`);
        const timings = await scenario.run(page, iteration);
        results[name].push({ ...(await prof(page).read()), timings });
      }
    } catch (error) {
      await page.screenshot({ path: `${outFile}.failure.png`, fullPage: true });
      throw error;
    }
    await page.context().close();
  }

  return results;
}

async function prepare(page: Page) {
  await signIn(page);
  const token = await page.evaluate(() =>
    (window as unknown as { Clerk: { session: { getToken: () => Promise<string> } } }).Clerk.session.getToken(),
  );
  for (const [path, body] of [
    ["/api/auth/clerk-sync", {}],
    [
      "/api/user/complete-profile",
      { dateOfBirth: "1990-01-01", height: 180, weight: 80, gender: "male", activityLevel: 3, unitSystem: "metric" },
    ],
  ] as const) {
    const response = await fetch(`${apiUrl}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`${path} returned ${response.status}: ${await response.text()}`);
  }
}

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

// Prints a Markdown table of medians, one column per argument. Join files
// with "+" to pool their runs into one column.
function compare(columns: string[]) {
  const labels = columns.map((column) => column.replaceAll(/[^+]*\/|\.json/g, ""));
  const data = columns.map((column) => {
    const pooled: Record<string, Run[]> = {};
    for (const file of column.split("+")) {
      for (const [scenario, runs] of Object.entries(JSON.parse(readFileSync(file, "utf8")) as Record<string, Run[]>)) {
        pooled[scenario] = [...(pooled[scenario] ?? []), ...runs];
      }
    }

    return pooled;
  });
  console.log(`| Scenario | Metric | ${labels.join(" | ")} |`);
  console.log(`| --- | --- | ${labels.map(() => "---").join(" | ")} |`);
  for (const scenario of Object.keys(data[0])) {
    const metrics: Record<string, (run: Run) => number> = {
      commits: (run) => run.commits,
      "component renders": (run) => run.renders,
      "React render ms": (run) => run.renderMs,
    };
    for (const timing of Object.keys(data[0][scenario][0].timings)) {
      metrics[`${timing} ms`] = (run) => run.timings[timing];
    }
    for (const [metric, pick] of Object.entries(metrics)) {
      const cells = data.map((runs) => median(runs[scenario].map(pick)).toFixed(metric.endsWith("ms") ? 1 : 0));
      console.log(`| ${scenario} | ${metric} | ${cells.join(" | ")} |`);
    }
  }
}

const [mode, ...args] = process.argv.slice(2);
if (mode === "compare") {
  compare(args);
} else {
  await clerkSetup();
  const browser = await chromium.launch();
  try {
    if (mode === "prepare") await prepare(await browser.newPage());
    else writeFileSync(args[1], JSON.stringify(await measure(browser, Number(args[0]), args[1]), undefined, 2));
  } finally {
    await browser.close();
  }
}
