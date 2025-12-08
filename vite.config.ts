import process from "node:process";
import { type GlobalsOption } from "rollup";
import { defineConfig, type LibraryOptions } from "vite";
import dts from "vite-plugin-dts";
import { externalizeDeps } from "vite-plugin-externalize-deps";

const umd = process.env.MODE === "umd";

const flavours: Record<string, LibraryOptions & { globals: GlobalsOption }> = {
  index: {
    fileName: "index",
    entry: ["src/index.ts"],
    name: "maptilerGeocoder",
    globals: {},
  },
  // leaflet: {
  //   fileName: "leaflet",
  //   entry: ["src/leaflet.ts"],
  //   name: "maptilerGeocoder",
  //    globals: {
  //      leaflet: "L",
  //    },
  // },
  maplibregl: {
    fileName: "maplibregl",
    entry: ["src/maplibregl.ts"],
    name: "maptilerGeocoder",
    globals: {
      "maplibre-gl": "maplibregl",
    },
  },
  maptilersdk: {
    fileName: "maptilersdk",
    entry: ["src/maptilersdk.ts"],
    name: "maptilerGeocoder",
    globals: {
      // replace MapLibre with MapTiler SDK
      "maplibre-gl": "maptilersdk",
      "@maptiler/sdk": "maptilersdk",
    },
  },
  openlayers: {
    fileName: "openlayers",
    entry: ["src/openlayers.ts"],
    name: "maptilerGeocoder",
    globals: (name) => (name.startsWith("ol") ? name.replaceAll("/", ".") : ""),
  },
};

const flavour = flavours[process.env.FLAVOUR!] ?? flavours.standalone;

export default defineConfig({
  plugins: [externalizeDeps({ deps: !umd }), umd ? undefined : dts({ exclude: ["demos"] })],
  publicDir: "public",
  build: {
    sourcemap: true,
    emptyOutDir: false,
    lib: flavour,
    rollupOptions: {
      output: [
        umd
          ? {
              name: flavour.name,
              format: "umd",
              entryFileNames: "[name].umd.js",
              chunkFileNames: "[name].umd.js",
              assetFileNames: "[name].[ext]",

              // Provide global variables to use in the UMD build for externalized deps
              globals: flavour.globals,
            }
          : {
              format: "es",
              entryFileNames: "[name].js",
              chunkFileNames: "[name].js",
              assetFileNames: "[name].[ext]",
            },
      ],
    },
  },
});
