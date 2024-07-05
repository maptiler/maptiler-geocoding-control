import { svelte } from "@sveltejs/vite-plugin-svelte";
import process from "node:process";
import { sveltePreprocess } from "svelte-preprocess";
import { defineConfig } from "vite";

const libs = {
  leaflet: {
    fileName: "leaflet",
    entry: ["src/leaflet.ts"],
    name: "leafletMaptilerGeocoder",
    formats: ["es", "umd"],
  },
  maplibre: {
    fileName: "maplibregl",
    entry: ["src/maplibregl.ts"],
    name: "maplibreglMaptilerGeocoder",
    formats: ["es", "umd"],
  },
  maptilersdk: {
    fileName: "maptilersdk",
    entry: ["src/maptilersdk.ts"],
    name: "maptilersdkMaptilerGeocoder",
    formats: ["es", "umd"],
  },
  openlayers: {
    fileName: "openlayers",
    entry: ["src/openlayers.ts"],
    name: "openlayersMaptilerGeocoder",
    formats: ["es", "umd"],
  },
  react: {
    fileName: "react",
    entry: ["src/react.ts"],
    name: "reactMaptilerGeocoder",
    formats: ["es", "umd"],
  },
  vanilla: {
    fileName: "vanilla",
    entry: ["src/vanilla.ts"],
    name: "maptilerGeocoder",
    formats: ["es", "umd"],
  },
  "leaflet-controller": {
    fileName: "leaflet-controller",
    entry: ["src/leaflet-controller.ts"],
    name: "leafletMaptilerGeocodingController",
    formats: ["es", "umd"],
  },
  "maplibregl-controller": {
    fileName: "maplibregl-controller",
    entry: ["src/maplibregl-controller.ts"],
    name: "maplibreglMaptilerGeocodingController",
    formats: ["es", "umd"],
  },
  "openlayers-controller": {
    fileName: "openlayers-controller",
    entry: ["src/openlayers-controller.ts"],
    name: "openlayersMaptilerGeocodingController",
    formats: ["es", "umd"],
  },
};

if (!process.env.FLAVOUR) {
  throw new Error("missing FLAVOUR environment variable");
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    svelte({
      preprocess: sveltePreprocess(),
    }),
  ],
  publicDir: "public",
  build: {
    sourcemap: true,
    emptyOutDir: false,
    lib: libs[process.env.FLAVOUR],
    // simplify after https://github.com/vitejs/vite/pull/10609 is released
    rollupOptions: {
      external: [
        "@maptiler/sdk",
        "maplibre-gl",
        "leaflet",
        "react",
        "react-dom",
        "ol",
      ],
      output: [
        {
          format: "es",
          entryFileNames: "[name].js",
          chunkFileNames: "[name].js",
          assetFileNames: "[name].[ext]",
        },
        {
          format: "cjs",
          entryFileNames: "[name].umd.js",
          chunkFileNames: "[name].umd.js",
          assetFileNames: "[name].[ext]",

          // Provide global variables to use in the UMD build for externalized deps
          globals: {
            "@maptiler/sdk": "maptilersdk",
            "maplibre-gl": "maplibregl",
            leaflet: "L",
            react: "React",
            "react-dom": "ReactDOM",
            ol: "ol",
          },
        },
      ],
    },
  },
});
