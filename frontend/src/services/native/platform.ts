import { Capacitor } from "@capacitor/core";

export const isNativePlatform = (): boolean => Capacitor.isNativePlatform();

export const getPlatform = (): "ios" | "android" | "web" => {
  const p = Capacitor.getPlatform();
  return p === "ios" || p === "android" ? p : "web";
};

export const isIOS = (): boolean => Capacitor.getPlatform() === "ios";
export const isAndroid = (): boolean => Capacitor.getPlatform() === "android";
