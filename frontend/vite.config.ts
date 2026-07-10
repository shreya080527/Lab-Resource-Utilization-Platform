import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// Vite dev server runs on port 5173 (the project's single exposed port).
// `@/` resolves to ./src via the explicit alias (covers all existing imports).
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  // Only pre-bundle deps reachable from the app entry — prevents the scanner
  // from crawling unrelated HTML files in skills/examples/etc.
  optimizeDeps: {
    entries: ["index.html", "src/**/*.ts", "src/**/*.tsx"],
  },
  server: {
    port: 5173,
    host: true,
    strictPort: true,
  },
  preview: {
    port: 5173,
    host: true,
  },
});
