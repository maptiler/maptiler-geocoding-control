import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  build: {
    lib: {
      fileName: "maptiler-geocoding",
      entry: "src/lib/index.ts",
      name: "maptilerGeocoding",
      formats: ["es", "cjs", "iife"],
    },
    rollupOptions: {
      external: ["maplibre-gl"],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          maplibregl: "maplibregl",
        },
      },
    },
  },
});
