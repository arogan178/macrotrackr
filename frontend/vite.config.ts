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

export default defineConfig(() => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  return {
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
      checker({ typescript: true }),
      viteCompression(),
      VitePWA({
        injectRegister: null,
        registerType: "autoUpdate",
        devOptions: {
          enabled: false,
        },
        manifest: {
          name: "Macro Tracker",
          short_name: "MacroTracker",
          description: "Track your macronutrients and nutrition goals",
          start_url: "/",
          display: "standalone",
          background_color: "#18181b",
          theme_color: "#6366f1",
          icons: [
            // Ensure we reference existing PNG assets so installed app icons work
            {
              src: "/icon.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any maskable",
            },
            {
              src: "/icon.png",
              sizes: "256x256",
              type: "image/png",
              purpose: "any maskable",
            },
            {
              src: "/icon.png",
              sizes: "384x384",
              type: "image/png",
              purpose: "any maskable",
            },
            {
              src: "/icon.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
            // Fallback favicon
            {
              src: "/favicon.ico",
              sizes: "48x48",
              type: "image/x-icon",
              purpose: "any",
            },
          ],
          categories: ["health", "fitness", "lifestyle"],
          lang: "en",
          orientation: "portrait-primary",
        },
        // Use custom service worker for better cache control
        srcDir: "src",
        filename: "service-worker.ts",
        strategies: "injectManifest",
        injectManifest: {
          injectionPoint: "globalThis.__WB_MANIFEST",
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
          // globDirectory removed - vite-plugin-pwa uses build.outDir automatically
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        },
      }),
      tsconfigPaths(),
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
            vendor: ["react", "react-dom"],
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
