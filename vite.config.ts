// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // GitHub Pages serves this project from /Ozee-Electricals/.
  // This will be changed to / when the custom domain is connected.
  base: "/Ozee-Electricals/",
  tanstackStart: {
    // Generate a static SPA shell for GitHub Pages.
    // Server-side functionality remains available when deployed to a server-capable platform.
    spa: {
      prerender: {
        outputPath: "/index.html",
        crawlLinks: false,
      },
    },
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
