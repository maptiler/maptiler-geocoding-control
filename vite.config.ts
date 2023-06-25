import { svelte } from "@sveltejs/vite-plugin-svelte";
import preprocess from "svelte-preprocess";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    svelte({
      preprocess: preprocess(),
    }),
  ],
  publicDir: "public",
  build: {
    sourcemap: true,
    emptyOutDir: false,
    lib:
      // simplify after https://github.com/vitejs/vite/pull/10609 is released
      process.env.VITE_FLAVOUR === "leaflet"
        ? {
            fileName: "leaflet",
            entry: ["src/lib/leaflet.ts"],
            name: "leafletMaptilerGeocoder",
            formats: ["es", "umd"],
          }
        : process.env.VITE_FLAVOUR === "maplibre"
        ? {
            fileName: "maplibregl",
            entry: ["src/lib/maplibregl.ts"],
            name: "maplibreglMaptilerGeocoder",
            formats: ["es", "umd"],
          }
        : process.env.VITE_FLAVOUR === "maptilersdk"
        ? {
            fileName: "maptilersdk",
            entry: ["src/lib/maptilersdk.ts"],
            name: "maptilersdkMaptilerGeocoder",
            formats: ["es", "umd"],
          }
        : process.env.VITE_FLAVOUR === "react"
        ? {
            fileName: "react",
            entry: ["src/lib/react.ts"],
            name: "MapTilerGeocoder",
            formats: ["es", "umd"],
          }
        : process.env.VITE_FLAVOUR === "leaflet-controller"
        ? {
            fileName: "leaflet-controller",
            entry: ["src/lib/leaflet-controller.ts"],
            name: "leafletMaptilerGeocodingController",
            formats: ["es", "umd"],
          }
        : process.env.VITE_FLAVOUR === "maplibregl-controller"
        ? {
            fileName: "maplibregl-controller",
            entry: ["src/lib/maplibregl-controller.ts"],
            name: "maplibreglMaptilerGeocodingController",
            formats: ["es", "umd"],
          }
        : undefined,
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
