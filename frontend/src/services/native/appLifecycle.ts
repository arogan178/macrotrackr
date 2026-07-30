import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { SplashScreen } from "@capacitor/splash-screen";
import { focusManager } from "@tanstack/react-query";

import { router } from "../../AppRouter";

import { initNativeGoogleAuth } from "./googleAuth";
import { isNativePlatform } from "./platform";

export function parseDeepLinkPathAndSearch(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    let path = url.pathname;
    if (url.protocol === "com.macrotrackr.app:" && url.host) {
      path = "/" + url.host + url.pathname;
    }
    const full = (path.startsWith("/") ? path : "/" + path) + url.search;

    return full || null;
  } catch {
    return null;
  }
}

export function initializeNativeAppLifecycle(
  onHardwareBackPress?: () => void,
): () => void {
  if (!isNativePlatform()) return () => {};

  // Pre-initialize native Google Auth bridge
  initNativeGoogleAuth();

  // Hide splash screen smoothly once the web view has loaded
  SplashScreen.hide().catch((err) =>
    console.debug("SplashScreen hide error:", err),
  );

  const backButtonListener = App.addListener("backButton", (event) => {
    if (onHardwareBackPress) {
      onHardwareBackPress();
    } else if (!event.canGoBack) {
      App.minimizeApp();
    } else {
      window.history.back();
    }
  });

  const appStateListener = App.addListener("appStateChange", ({ isActive }) => {
    focusManager.setFocused(isActive);
  });

  const appUrlListener = App.addListener("appUrlOpen", async (data) => {
    try {
      await Browser.close().catch(() => {});

      const pathAndSearch = parseDeepLinkPathAndSearch(data.url);
      if (pathAndSearch) {
        router.history.push(pathAndSearch);
      }
    } catch (err) {
      console.debug("appUrlOpen parse error:", err);
    }
  });

  return () => {
    backButtonListener.then((handler) => handler.remove());
    appStateListener.then((handler) => handler.remove());
    appUrlListener.then((handler) => handler.remove());
  };
}
