import AppRouter from "./AppRouter";

// Global CSS variable for floating notification top offset (default 16px)
// If your project sets CSS variables elsewhere (e.g., global.css), move this there.
if (typeof document !== "undefined") {
  const root = document.documentElement;
  if (!root.style.getPropertyValue("--floating-notification-top")) {
    root.style.setProperty("--floating-notification-top", "16px");
  }
}

export default function App() {
  return <AppRouter />;
}