import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import autoprefixer from "autoprefixer";
import cssnano from "cssnano";
import { defineConfig } from "vite";
import checker from "vite-plugin-checker";
import viteCompression from "vite-plugin-compression";
import { VitePWA } from "vite-plugin-pwa";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    checker({ typescript: true }),
    viteCompression(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Macro Tracker",
        short_name: "MacroTracker",
        start_url: "/",
        display: "standalone",
        background_color: "#18181b",
        theme_color: "#6366f1",
        icons: [
          {
            src: "/vite.svg",
            sizes: "192x192",
            type: "image/svg+xml",
          },
        ],
      },
    }),
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(path.dirname(fileURLToPath(import.meta.url)), "src"),
    },
  },
  build: {
    target: "esnext",
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        dead_code: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          charts: ["recharts"],
        },
      },
    },
  },
  css: {
    modules: {
      localsConvention: "camelCase",
    },
    postcss: {
      plugins: [autoprefixer(), cssnano()],
    },
  },
});
