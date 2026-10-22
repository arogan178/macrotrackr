import { SystemBars, SystemBarsStyle } from "@capacitor/core";

import { isNativePlatform } from "./platform";

// The app draws edge-to-edge, so the page paints behind the bars and only the
// icon colour needs setting.
export async function setupStatusBar(isDark = true): Promise<void> {
  if (!isNativePlatform()) return;
  try {
    await SystemBars.setStyle({
      style: isDark ? SystemBarsStyle.Dark : SystemBarsStyle.Light,
    });
  } catch (error) {
    console.debug("StatusBar setup failed or not supported:", error);
  }
}
