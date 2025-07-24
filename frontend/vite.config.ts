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

export default defineConfig(({ command, mode }) => {
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
            proxy.on("proxyReq", (proxyReq, req) => {
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
        "@": path.resolve(__dirname, "src"),
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
          // Add hash to filenames for cache busting
          entryFileNames: `assets/[name].[hash].js`,
          chunkFileNames: `assets/[name].[hash].js`,
          assetFileNames: `assets/[name].[hash].[ext]`,
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
  };
});
