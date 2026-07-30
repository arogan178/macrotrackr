import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";

import { isNativePlatform } from "./platform";

export async function triggerImpact(
  style: ImpactStyle = ImpactStyle.Light,
): Promise<void> {
  if (!isNativePlatform()) return;
  try {
    await Haptics.impact({ style });
  } catch (error) {
    console.debug("Haptics impact not supported:", error);
  }
}

export async function triggerSelection(): Promise<void> {
  if (!isNativePlatform()) return;
  try {
    await Haptics.selectionChanged();
  } catch (error) {
    console.debug("Haptics selection not supported:", error);
  }
}

export async function triggerNotification(
  type: NotificationType = NotificationType.Success,
): Promise<void> {
  if (!isNativePlatform()) return;
  try {
    await Haptics.notification({ type });
  } catch (error) {
    console.debug("Haptics notification not supported:", error);
  }
}
