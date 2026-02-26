import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/",
  build: {
    sourcemap: false,
    minify: "terser",
    terserOptions: {
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      output: {
        compact: true,
      },
      plugins: [
        // Strip React Router version from bundle so Wappalyzer can't detect it from script content
        {
          name: "strip-react-router-version",
          generateBundle(_, bundle) {
            for (const file of Object.values(bundle)) {
              if (file.type === "chunk" && file.code) {
                file.code = file.code.replace(
                  /window\.__reactRouterVersion\s*=\s*["'][^"']*["']/g,
                  'window.__reactRouterVersion=""',
                );
                file.code = file.code.replace(/["']7\.13\.0["']/g, '""');
              }
            }
          },
        },
      ],
    },
  },
});
