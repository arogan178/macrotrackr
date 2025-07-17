import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import React from "react";
import ReactDOM from "react-dom/client";

import AppRouter from "./AppRouter";
import { queryClient } from "./lib/queryClient";

ReactDOM.createRoot(document.querySelector("#root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppRouter />
      {/* Only show devtools in development */}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  </React.StrictMode>,
);
