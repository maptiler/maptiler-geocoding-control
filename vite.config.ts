import process from "node:process";
import { type GlobalsOption } from "rollup";
import { type Options as ReplaceOptions } from "unplugin-replace";
import replace from "unplugin-replace/vite";
import { defineConfig, type LibraryOptions } from "vite";
import dts from "vite-plugin-dts";
import { externalizeDeps } from "vite-plugin-externalize-deps";

const umd = process.env.MODE === "umd";

const flavours: Record<string, LibraryOptions & { globals: GlobalsOption } & { replace?: ReplaceOptions["values"] }> = {
  index: {
    fileName: "index",
    entry: ["src/index.ts"],
    name: "maptilerGeocoder",
    globals: {},
  },
  leaflet: {
    fileName: "leaflet",
    entry: ["src/leaflet.public.ts"],
    name: "maptilerGeocoder",
    globals: {
      leaflet: "L",
    },
  },
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
    replace: [
      // replace MapLibre with MapTiler SDK
      { find: /from "maplibre-gl"/, replacement: 'from "@maptiler/sdk"' },
    ],
    globals: {
      "@maptiler/sdk": "maptilersdk",
    },
  },
  openlayers: {
    fileName: "openlayers",
    entry: ["src/openlayers.public.ts"],
    name: "maptilerGeocoder",
    globals: (name) => (name.startsWith("ol") ? name.replaceAll("/", ".") : ""),
  },
};

const flavour = flavours[process.env.FLAVOUR!];
if (!process.env.FLAVOUR) throw new Error("No flavour specified for build!");
if (!flavour) throw new Error(`Flavour "${process.env.FLAVOUR}" is not valid for build!`);

export default defineConfig({
  plugins: [externalizeDeps({ deps: !umd }), umd ? replace({ values: flavour.replace }) : dts({ exclude: ["demos", "test", "vite.config*", "vitest-setup-tests.ts"] })],
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
