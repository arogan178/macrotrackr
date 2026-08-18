import { useEffect } from "react";

import { initializeNativeAppLifecycle } from "./services/native/appLifecycle";
import { setupStatusBar } from "./services/native/statusBar";
import AppRouter from "./AppRouter";

export default function App() {
  useEffect(() => {
    setupStatusBar(true);
    const cleanup = initializeNativeAppLifecycle();

    return () => cleanup();
  }, []);

  return <AppRouter />;
}