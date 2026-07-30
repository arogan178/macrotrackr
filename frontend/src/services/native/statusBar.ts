import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { isNativePlatform } from "./platform";

export async function setupStatusBar(isDark = true): Promise<void> {
  if (!isNativePlatform()) return;
  try {
    await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
    if (Capacitor.getPlatform() === "android") {
      await StatusBar.setBackgroundColor({ color: isDark ? "#09090b" : "#ffffff" });
    }
  } catch (error) {
    console.debug("StatusBar setup failed or not supported:", error);
  }
}
