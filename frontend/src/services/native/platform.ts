import { Capacitor } from "@capacitor/core";

export const isNativePlatform = () => Capacitor.isNativePlatform();
export const getPlatform = (): "ios" | "android" | "web" => {
  const p = Capacitor.getPlatform();
  return p === "ios" || p === "android" ? p : "web";
};
export const isIOS = () => Capacitor.getPlatform() === "ios";
export const isAndroid = () => Capacitor.getPlatform() === "android";
