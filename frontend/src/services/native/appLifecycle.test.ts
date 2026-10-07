import { beforeEach, describe, expect, it, vi } from "vitest";

import { initializeNativeAppLifecycle } from "./appLifecycle";

const { listeners, history } = vi.hoisted(() => ({
  listeners: new Map<string, (data: { url: string }) => Promise<void>>(),
  history: { push: vi.fn(), replace: vi.fn() },
}));

vi.mock("@capacitor/app", () => ({
  App: {
    addListener: (
      event: string,
      handler: (data: { url: string }) => Promise<void>,
    ) => {
      listeners.set(event, handler);

      return Promise.resolve({ remove: vi.fn() });
    },
    minimizeApp: vi.fn(),
  },
}));
vi.mock("@capacitor/browser", () => ({
  Browser: { close: () => Promise.resolve() },
}));
vi.mock("@capacitor/splash-screen", () => ({
  SplashScreen: { hide: () => Promise.resolve() },
}));
vi.mock("../../AppRouter", () => ({ router: { history } }));
vi.mock("./googleAuth", () => ({ initNativeGoogleAuth: vi.fn() }));
vi.mock("./platform", () => ({ isNativePlatform: () => true }));

async function openDeepLink(url: string) {
  initializeNativeAppLifecycle();
  await listeners.get("appUrlOpen")?.({ url });
}

describe("appUrlOpen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listeners.clear();
  });

  // Pushing would leave /login behind the handoff, so Back returns to sign-in.
  it.each([
    [
      "com.macrotrackr.app://sso-callback?flow=signin&redirectTo=%2Fhome",
      "/sso-callback?flow=signin&redirectTo=%2Fhome",
    ],
    [
      "com.macrotrackr.app://auth-ready?redirectTo=%2Fhome",
      "/auth-ready?redirectTo=%2Fhome",
    ],
    [
      "https://macrotrackr.com/sso-callback?flow=signup",
      "/sso-callback?flow=signup",
    ],
  ])("replaces history for the auth handoff %s", async (url, expected) => {
    await openDeepLink(url);

    expect(history.replace).toHaveBeenCalledWith(expected);
    expect(history.push).not.toHaveBeenCalled();
  });

  it("pushes other deep links", async () => {
    await openDeepLink("com.macrotrackr.app://home");

    expect(history.push).toHaveBeenCalledWith("/home");
    expect(history.replace).not.toHaveBeenCalled();
  });
});
