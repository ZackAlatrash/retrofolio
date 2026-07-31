/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { seoHead, seoJsonLd, seoBody, seoDescription } from "./scripts/seoHtml";

/**
 * Injects the crawlable half of the page at build time: social cards, Person
 * schema, and a plain-HTML summary inside `#root` that React discards on mount.
 * All of it is derived from `src/content/`, so it cannot drift from the screens.
 *
 * Build only. The dev server keeps the empty root, so what is worked on in
 * development is the app rather than a placeholder it immediately replaces.
 */
function seoHtml(): Plugin {
  return {
    name: "seo-html",
    apply: "build",
    transformIndexHtml(html) {
      return html
        // The hand-written description stopped at 83 characters; the generated
        // one uses the ~150 a snippet actually gets.
        .replace(
          /<meta name="description" content="[^"]*" \/>/,
          `<meta name="description" content="${seoDescription()}" />`,
        )
        .replace("</head>", `  ${seoHead()}\n    ${seoJsonLd()}\n  </head>`)
        .replace('<div id="root"></div>', `<div id="root">${seoBody()}</div>`);
    },
  };
}

export default defineConfig({
  /**
   * Where the site is served from. Root by default, which is what the dev
   * server and a domain-root host both want. GitHub Pages serves a project
   * site under /<repo>/ instead, so its workflow sets VITE_BASE and every
   * asset URL in the app is built from import.meta.env.BASE_URL to match.
   */
  base: process.env.VITE_BASE ?? "/",
  plugins: [react(), tailwindcss(), seoHtml()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
    exclude: ["**/node_modules/**", "**/tests/e2e/**"],
  },
});
