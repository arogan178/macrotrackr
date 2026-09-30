#!/usr/bin/env node

import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { chromium } from "@playwright/test";

function readArgument(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

const baseUrl = readArgument(
  "--base-url",
  process.env.FRONTEND_URL || "http://localhost:5173",
);
const apiUrl = readArgument(
  "--api-url",
  process.env.VITE_API_URL || "http://localhost:3000",
);
const email = readArgument("--email", "verify-agent@example.com");
const statePath = readArgument(
  "--state",
  ".artifacts/verify-macrotrackr/auth-state.json",
);
// Only ever stored in the local dev database.
const password = "Verify-Agent-Local-2026!";

const browser = await chromium.launch();
try {
  const context = await browser.newContext({ baseURL: baseUrl });
  const page = await context.newPage();
  await page.goto("/");

  // Posts from the page so the browser stores the session cookie exactly as the app does.
  const result = await page.evaluate(
    async ({ apiUrl, email, password }) => {
      const post = (path, body) =>
        fetch(`${apiUrl}/api/auth/${path}`, {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
      const login = await post("login", { email, password });
      if (login.ok) return { ok: true };

      const register = await post("register", {
        email,
        password,
        firstName: "Verify",
        lastName: "Agent",
      });
      return {
        ok: register.ok,
        status: register.status,
        body: await register.text(),
      };
    },
    { apiUrl, email, password },
  );
  if (!result.ok) {
    throw new Error(
      `Local sign-in failed with ${result.status}: ${result.body}. Is the backend running with AUTH_MODE=local?`,
    );
  }

  await page.goto("/home");
  await page.waitForURL(/\/(home|profile-setup)/u, { timeout: 30_000 });

  await mkdir(dirname(statePath), { recursive: true });
  await context.storageState({ path: statePath });
  console.log(
    JSON.stringify({ baseUrl, email, statePath, landedOn: page.url() }),
  );
} finally {
  await browser.close();
}
