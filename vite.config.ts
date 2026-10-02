// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
//
// Additional Vite options must be passed through the `vite` property.

import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    // Custom domain is served from the root path.
    base: "/",
  },

  tanstackStart: {
    // Generate a static SPA shell for GitHub Pages
    spa: {
      prerender: {
        outputPath: "/index.html",
        crawlLinks: false,
      },
    },

    // Use src/server.ts as the TanStack Start server entry
    server: {
      entry: "server",
    },
  },
});
