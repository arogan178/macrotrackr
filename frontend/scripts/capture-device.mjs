// Native capture: drives the real Capacitor app on a connected Android device
// and saves true device frames (status bar, gesture bar, real rounded corners)
// for the store listing and the vertical video cut.
//
//   1. Seed and serve the demo backend (see backend/scripts/seed-demo.ts)
//   2. Build and install:  CAPACITOR=true CAPACITOR_HOSTNAME=localhost \
//        VITE_API_URL=http://<lan-ip>:3001 bun run build && bunx cap sync android
//        && (cd android && ./gradlew assembleDebug) && adb install -r <apk>
//   3. Unlock the phone, then:  node scripts/capture-device.mjs
//
// The webview is driven over CDP (Capacitor debug builds expose
// webview_devtools_remote), while the pixels come from `adb screencap`. Driving
// and capturing are deliberately split: CDP screenshots would give us the web
// viewport again, and the whole point of this pass is the native chrome.

import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import dotenv from "dotenv";
import { chromium } from "@playwright/test";

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: resolve(__dirname, "..", ".env.test") });

const OUT_DIR = resolve(__dirname, "..", "..", "assets", "capture", "device");
const PACKAGE = "com.macrotrackr.app";
const PORT = 9222;

const EMAIL = process.env.E2E_CLERK_USER_EMAIL;
const PASSWORD = process.env.E2E_CLERK_USER_PASSWORD;

if (!EMAIL || !PASSWORD) {
  throw new Error("E2E_CLERK_USER_EMAIL and E2E_CLERK_USER_PASSWORD must be set (frontend/.env.test)");
}

async function adb(args, { binary = false } = {}) {
  const { stdout } = await execFileAsync("adb", args, {
    encoding: binary ? "buffer" : "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return stdout;
}

/** Fails loudly rather than capturing a lock screen. */
async function assertUnlocked() {
  const dump = await adb(["shell", "dumpsys", "window"]);
  if (/mDreamingLockscreen=true|isStatusBarKeyguard=true/u.test(dump)) {
    throw new Error("Device is locked. Unlock the phone and re-run.");
  }
}

async function screencap(name) {
  const png = await adb(["exec-out", "screencap", "-p"], { binary: true });
  const path = resolve(OUT_DIR, `${name}.png`);
  await writeFile(path, png);
  console.log(`  ${name}.png (${(png.length / 1024).toFixed(0)} KB)`);
}

async function findWebviewSocket() {
  const unix = await adb(["shell", "cat", "/proc/net/unix"]);
  const match = unix.match(/webview_devtools_remote_\d+/u);
  if (!match) {
    throw new Error("No webview devtools socket. Is the app running and a debug build?");
  }
  return match[0];
}

/**
 * Routes inside the SPA. A real navigation (page.goto) is fatal here: Capacitor
 * serves the bundle through a WebViewAssetLoader bound to the initial load, so
 * re-requesting https://localhost/... from CDP gets ERR_CONNECTION_REFUSED.
 * Pushing history and firing popstate lets TanStack Router handle it instead.
 */
async function navigate(page, path) {
  await page.evaluate((target) => {
    window.history.pushState({}, "", target);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, path);
  await page.waitForTimeout(500);
}

const SHOTS = [
  { name: "home", path: "/home", settle: /Welcome back, Andrea/iu },
  { name: "analytics", path: "/reporting", settle: /^Analytics$/iu },
  { name: "goals", path: "/goals", settle: /Your Goals/iu },
  { name: "settings", path: "/settings", settle: /^Settings$/iu },
];

async function main() {
  await assertUnlocked();
  await mkdir(OUT_DIR, { recursive: true });

  const socket = await findWebviewSocket();
  await adb(["forward", `tcp:${PORT}`, `localabstract:${socket}`]);
  console.log(`Attached to ${socket} on :${PORT}`);

  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${PORT}`);
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  // Sign in through the real form. @clerk/testing's programmatic signIn needs a
  // testing token injected at page creation, which is not available in a
  // webview we merely attached to — but a `+clerk_test` user accepts a plain
  // password sign-in.
  // The webview keeps its Clerk session across runs, so probe for a signed-in
  // home screen first and only sign in when that fails. Checking the URL alone
  // was wrong: a signed-in app can sit on any route.
  await navigate(page, "/home");
  const signedIn = await page
    .getByText(/Welcome back, Andrea/iu)
    .first()
    .waitFor({ state: "attached", timeout: 10_000 })
    .then(() => true)
    .catch(() => false);

  if (!signedIn) {
    await navigate(page, "/login");
    // The mobile sign-in screen offers fingerprint / Google / email first; the
    // email field only exists after choosing that path.
    await page.getByRole("button", { name: /continue with email/iu }).first().click();
    const email = page.getByRole("textbox", { name: /email/iu }).first();
    await email.waitFor({ timeout: 30_000 });
    await email.fill(EMAIL);
    await page.getByRole("textbox", { name: /password/iu }).first().fill(PASSWORD);
    await page.getByRole("button", { name: /sign in|continue|log in/iu }).first().click();
    await page.waitForURL(/\/home/u, { timeout: 60_000 });
    console.log("Signed in");
  }

  for (const shot of SHOTS) {
    await navigate(page, shot.path);
    await page.getByText(shot.settle).first().waitFor({ state: "attached", timeout: 30_000 });
    // Same no-spinner gate as the web pass: a heading can render while a
    // blocking overlay is still up.
    await page
      .waitForFunction(
        () =>
          [...document.querySelectorAll(".animate-spin")].every(
            (el) => el.offsetParent === null,
          ),
        undefined,
        { timeout: 30_000 },
      )
      .catch(() => console.warn(`  ${shot.name}: spinner still visible`));
    await page.waitForTimeout(900);
    await screencap(shot.name);
  }

  await browser.close();
  await adb(["forward", "--remove", `tcp:${PORT}`]);
  console.log(`\nWrote ${SHOTS.length} device frames to ${OUT_DIR}`);
}

await main();
