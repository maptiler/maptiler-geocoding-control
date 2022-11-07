import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  build: {
    lib: {
      fileName: "index",
      entry: "src/lib/index.ts",
      name: "maplibreglMaptilerGeocoder",
      formats: ["es", "cjs", "iife"],
    },
    rollupOptions: {
      external: ["maplibre-gl", "leaflet"],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          "maplibre-gl": "maplibregl",
          leaflet: "leaflet",
        },
      },
    },
  },
});
