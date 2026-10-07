import { defineConfig, mergeConfig } from "vite";

import baseConfig from "../../vite.config.ts";

// The production build on React's profiling renderer, with function names kept
// so renders can be counted per component. Never used for a shipped build.
export default defineConfig((env) =>
  mergeConfig(baseConfig(env), {
    resolve: { alias: { "react-dom/client": "react-dom/profiling" } },
    build: { rolldownOptions: { output: { keepNames: true } } },
  }),
);
