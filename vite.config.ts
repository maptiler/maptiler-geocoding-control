import { svelte } from "@sveltejs/vite-plugin-svelte";
import process from "node:process";
import { sveltePreprocess } from "svelte-preprocess";
import { BuildOptions, defineConfig } from "vite";
import { syncInfo } from "./sync-info";

const libs = {
  leaflet: {
    fileName: "leaflet",
    entry: ["src/leaflet.ts"],
    name: "leafletMaptilerGeocoder",
  },
  maplibre: {
    fileName: "maplibregl",
    entry: ["src/maplibregl.ts"],
    name: "maplibreglMaptilerGeocoder",
  },
  maptilersdk: {
    fileName: "maptilersdk",
    entry: ["src/maptilersdk.ts"],
    name: "maptilersdkMaptilerGeocoder",
  },
  openlayers: {
    fileName: "openlayers",
    entry: ["src/openlayers.ts"],
    name: "openlayersMaptilerGeocoder",
  },
  react: {
    fileName: "react",
    entry: ["src/react.ts"],
    name: "reactMaptilerGeocoder",
  },
  vanilla: {
    fileName: "vanilla",
    entry: ["src/vanilla.ts"],
    name: "maptilerGeocoder",
  },
  "leaflet-controller": {
    fileName: "leaflet-controller",
    entry: ["src/leaflet-controller.ts"],
    name: "leafletMaptilerGeocodingController",
  },
  "maplibregl-controller": {
    fileName: "maplibregl-controller",
    entry: ["src/maplibregl-controller.ts"],
    name: "maplibreglMaptilerGeocodingController",
  },
  "openlayers-controller": {
    fileName: "openlayers-controller",
    entry: ["src/openlayers-controller.ts"],
    name: "openlayersMaptilerGeocodingController",
  },
};

let lib: BuildOptions["lib"];

let rollupOptions: BuildOptions["rollupOptions"];

const flavour = process.env.FLAVOUR;

if (flavour) {
  if (!(flavour in libs)) {
    throw new Error("invalid FLAVOUR");
  }

  lib = libs[flavour as keyof typeof libs];

  rollupOptions = {
    external: [
      "@maptiler/sdk",
      "maplibre-gl",
      "leaflet",
      "react",
      "react-dom",
      /^ol(\/.*)?/,
    ],
    output: [
      {
        format: "es",
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name].[ext]",
      },
      {
        name: lib.name,
        format: "umd",
        entryFileNames: "[name].umd.js",
        chunkFileNames: "[name].umd.js",
        assetFileNames: "[name].[ext]",

        // Provide global variables to use in the UMD build for externalized deps
        globals(name) {
          const global = {
            "@maptiler/sdk": "maptilersdk",
            "maplibre-gl": "maplibregl",
            leaflet: "L",
            react: "React",
            "react-dom": "ReactDOM",
          }[name];

          return (
            global ?? (name.startsWith("ol") ? name.replace(/\//g, ".") : "")
          );
        },
      },
    ],
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    {
      name: "sync-info",
      buildStart: syncInfo,
    },
    svelte({
      preprocess: sveltePreprocess(),
    }),
  ],
  publicDir: "public",
  build: {
    sourcemap: true,
    emptyOutDir: false,
    lib,
    rollupOptions,
  },
});
