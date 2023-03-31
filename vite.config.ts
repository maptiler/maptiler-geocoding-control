import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  build: {
    sourcemap: true,
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
        : process.env.FLAVOUR === "maplibre"
        ? {
            fileName: "maplibregl",
            entry: ["src/lib/MaplibreglGeocodingControl.ts"],
            name: "maplibreglMaptilerGeocoder",
            formats: ["es", "umd"],
          }
        : process.env.FLAVOUR === "react"
        ? {
            fileName: "react",
            entry: ["src/lib/ReactGeocodingControl.ts"],
            name: "MaptilerGeocoder",
            formats: ["es", "umd"],
          }
        : process.env.FLAVOUR === "leaflet-controller"
        ? {
            fileName: "leaflet-controller",
            entry: ["src/lib/leafletMapController.ts"],
            name: "leafletMaptilerGeocodingController",
            formats: ["es", "umd"],
          }
        : process.env.FLAVOUR === "maplibregl-controller"
        ? {
            fileName: "maplibregl-controller",
            entry: ["src/lib/maplibreglMapController.ts"],
            name: "maplibreglMaptilerGeocodingController",
            formats: ["es", "umd"],
          }
        : error(new Error("unknown FLAVOUR")),
    rollupOptions: {
      external: [
        "@maptiler/sdk",
        "maplibre-gl",
        "leaflet",
        "react",
        "react-dom",
      ],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          "@maptiler/sdk": "maptilersdk",
          "maplibre-gl": "maplibregl",
          leaflet: "leaflet",
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
  },
});

function error(e: any): any {
  throw e;
}
