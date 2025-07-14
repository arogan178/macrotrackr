import React from "react";
import ReactDOM from "react-dom/client";

import AppRouter from "./appRouter";

ReactDOM.createRoot(document.querySelector("#root")!).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>,
);
