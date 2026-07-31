import { useEffect } from "react";

import { initializeNativeAppLifecycle, setupStatusBar } from "./services/native";
import AppRouter from "./AppRouter";

export default function App() {
  useEffect(() => {
    setupStatusBar(true);
    const cleanup = initializeNativeAppLifecycle();

    return () => cleanup();
  }, []);

  return <AppRouter />;
}