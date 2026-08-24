import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import autoprefixer from "autoprefixer";
import cssnano from "cssnano";
import checker from "vite-plugin-checker";
import viteCompression from "vite-plugin-compression";
import { VitePWA } from "vite-plugin-pwa";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig(({ command }) => {
  const isDevServer = command === "serve";
  const isCapacitor = process.env.CAPACITOR === "true";
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  // The landing hero announces the current version; read it from package.json
  // so a release bump is the only place the number has to change.
  const { version } = createRequire(import.meta.url)("./package.json");
  return {
    define: {
      __APP_VERSION__: JSON.stringify(version),
    },
    server: {
      proxy: {
        "/api": {
          target: "http://127.0.0.1:3000",
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
            proxy.on("error", (err) => {
              console.log("Proxy error:", err);
            });
            proxy.on("proxyReq", (_proxyReq, req) => {
              console.log(
                "Proxying request:",
                req.method,
                req.url,
                "-> http://127.0.0.1:3000" + req.url,
              );
            });
          },
        },
      },
    },
    plugins: [
      tanstackRouter({
        target: "react",
        autoCodeSplitting: true,
      }),
      react(),
      tailwindcss(),
      ...(isDevServer ? [checker({ typescript: true })] : []),
      ...(!isCapacitor ? [viteCompression()] : []),
      ...(!isCapacitor
        ? [
            VitePWA({
              injectRegister: null,
              registerType: "autoUpdate",
              devOptions: {
                enabled: false,
              },
              manifest: {
                id: "/",
                name: "MacroTrackr",
                short_name: "MacroTrackr",
                description:
                  "Log meals in seconds, set a macro split, and see where the week actually went.",
                // The app, not the marketing page. `/` is a sales pitch with a
                // "Log in" button in its header regardless of session state, so
                // launching there made an installed app look signed out every
                // time. `/home` is behind RequireAuth, which sends a genuinely
                // signed-out launch to /login on its own.
                //
                // `id` stays "/" so this is a manifest update to the same
                // installed app rather than a second install.
                start_url: "/home",
                display: "standalone",
                // Shortcuts put the two things people open the app for on the
                // launcher's long-press menu.
                shortcuts: [
                  {
                    name: "Log a meal",
                    short_name: "Log",
                    url: "/home?log=1",
                  },
                  {
                    name: "This week",
                    short_name: "Week",
                    url: "/reporting",
                  },
                ],
                background_color: "#0c0a09",
                theme_color: "#0c0a09",
                // `any` and `maskable` are different drawings, not the same
                // file declared twice: a maskable icon is cropped to a circle
                // or squircle, so it needs its own safe padding.
                icons: [
                  {
                    src: "/mark.svg",
                    sizes: "any",
                    type: "image/svg+xml",
                    purpose: "any",
                  },
                  {
                    src: "/icon.png",
                    sizes: "512x512",
                    type: "image/png",
                    purpose: "any",
                  },
                  {
                    src: "/icon-maskable.png",
                    sizes: "512x512",
                    type: "image/png",
                    purpose: "maskable",
                  },
                  {
                    src: "/favicon.ico",
                    sizes: "48x48",
                    type: "image/x-icon",
                    purpose: "any",
                  },
                ],
                categories: ["health", "fitness", "lifestyle"],
                lang: "en",
              },
              srcDir: "src",
              filename: "service-worker.ts",
              strategies: "injectManifest",
              injectManifest: {
                injectionPoint: "globalThis.__WB_MANIFEST",
                globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
                maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
              },
            }),
          ]
        : []),
      tsconfigPaths(),
      // Bundle analyzer - generates stats.html in dist folder
      visualizer({
        open: false,
        gzipSize: true,
        brotliSize: true,
        filename: "dist/stats.html",
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    build: {
      target: "esnext",
      // Use esbuild for minification: much faster and far less memory-hungry than terser.
      // This reduces V8 heap pressure during production builds on small machines.
      minify: "esbuild",
      // Disable production sourcemaps to lower memory usage during build.
      sourcemap: false,
      rollupOptions: {
        output: {
          // Add hash to filenames for cache busting
          entryFileNames: `assets/[name].[hash].js`,
          chunkFileNames: `assets/[name].[hash].js`,
          assetFileNames: `assets/[name].[hash].[ext]`,
          manualChunks: {
            // Vendor chunks - split by library for better caching
            "vendor-react": ["react", "react-dom"],
            "vendor-router": ["@tanstack/react-router"],
            "vendor-query": ["@tanstack/react-query"],
            "vendor-charts": ["recharts"],
            "vendor-motion": ["motion"],
            "vendor-clerk": ["@clerk/react"],
            "vendor-ui": [
              "lucide-react",
              "clsx",
              "tailwind-merge",
            ],
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
  };
});
