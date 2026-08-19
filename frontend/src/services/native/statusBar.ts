import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";

import { resolveTokens } from "@/lib/designTokens";

import { isNativePlatform } from "./platform";

export async function setupStatusBar(isDark = true): Promise<void> {
  if (!isNativePlatform()) return;
  try {
    await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
    if (Capacitor.getPlatform() === "android") {
      // This said #09090b, the background from before the palette warmed to
      // #0c0a09, so the Android status bar was a few points cooler than the page
      // under it. The Capacitor API takes a string, so it is resolved rather
      // than named.
      const tokens = resolveTokens();
      await StatusBar.setBackgroundColor({
        color: isDark ? tokens.background : tokens.foreground,
      });
    }
  } catch (error) {
    console.debug("StatusBar setup failed or not supported:", error);
  }
}
