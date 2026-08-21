import type { CapacitorConfig } from "@capacitor/cli";

const hostname = process.env.CAPACITOR_HOSTNAME || "app.macrotrackr.com";
const isLocalDev = hostname === "localhost" || hostname.startsWith("192.168.");

const config: CapacitorConfig = {
  appId: "com.macrotrackr.app",
  appName: "MacroTrackr",
  webDir: "dist",
  // No overrideUserAgent here on purpose. It used to claim this webview was
  // Chrome, which reads as evading Google's rule that OAuth must not run in an
  // embedded webview, and risks the Google account rather than just a review.
  // Nothing needs it: native Google sign-in goes through the GoogleAuth plugin
  // and every other provider opens in a Custom Tab via Browser.open, so no
  // provider ever sees the webview's user agent.
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
      backgroundColor: "#000000",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#000000",
    },
    Keyboard: {
      // `body` resizes the document itself, which moves a position: fixed
      // header up with the keyboard and makes the bar jump on the Add-entry
      // form. `native` leaves the layout viewport alone and lets the webview
      // scroll the focused field into view instead.
      resize: "native",
      style: "DARK",
      resizeOnFullScreen: true,
    },
  },
};

export default config;
