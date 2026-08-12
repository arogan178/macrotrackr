import type { CapacitorConfig } from "@capacitor/cli";

const hostname = process.env.CAPACITOR_HOSTNAME || "app.macrotrackr.com";
const isLocalDev = hostname === "localhost" || hostname.startsWith("192.168.");

const config: CapacitorConfig = {
  appId: "com.macrotrackr.app",
  appName: "Macro Trackr",
  webDir: "dist",
  overrideUserAgent:
    "Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36",
  server: {
    hostname,
    androidScheme: "https",
    cleartext: isLocalDev,
    // Every entry here is a host the webview may navigate to, so keep it to
    // the sign-in flows that actually need it. Analytics never navigates, and
    // a wildcard over a large provider surface (e.g. *.cloudflare.com) turns
    // any open redirect on that surface into a webview navigation.
    allowNavigation: [
      "*.clerk.com",
      "*.clerk.accounts.dev",
      "clerk.macrotrackr.com",
      "macrotrackr.com",
      "*.macrotrackr.com",
      "accounts.google.com",
      "*.google.com",
      "appleid.apple.com",
      "challenges.cloudflare.com",
    ],
  },
  plugins: {
    GoogleAuth: {
      scopes: ["profile", "email"],
      serverClientId: "880247591600-g42kbb95b131mcjfrn838ruj89pe0mp5.apps.googleusercontent.com",
      forceCodeForRefreshToken: true,
    },
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: "#09090b",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#09090b",
    },
    Keyboard: {
      resize: "body",
      style: "DARK",
      resizeOnFullScreen: true,
    },
  },
};

export default config;
