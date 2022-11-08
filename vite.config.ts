import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  build: {
    emptyOutDir: false,
    lib:
      // simplify after https://github.com/vitejs/vite/pull/10609 is released
      process.env.FLAVOUR === "leaflet"
        ? {
            fileName: "leaflet",
            entry: ["src/lib/LeafletGeocodingControl.ts"],
            name: "leafletMaptilerGeocoder",
            formats: ["es", "umd"],
          }
        : {
            fileName: "maplibregl",
            entry: ["src/lib/MaplibreglGeocodingControl.ts"],
            name: "maplibreglMaptilerGeocoder",
            formats: ["es", "umd"],
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
