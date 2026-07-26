/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  /**
   * Where the site is served from. Root by default, which is what the dev
   * server and a domain-root host both want. GitHub Pages serves a project
   * site under /<repo>/ instead, so its workflow sets VITE_BASE and every
   * asset URL in the app is built from import.meta.env.BASE_URL to match.
   */
  base: process.env.VITE_BASE ?? "/",
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
    exclude: ["**/node_modules/**", "**/tests/e2e/**"],
  },
});
