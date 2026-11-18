import process from "node:process";
import { type GlobalsOption } from "rollup";
import { defineConfig, type LibraryOptions, transformWithEsbuild } from "vite";
import dts from "vite-plugin-dts";
import { externalizeDeps } from "vite-plugin-externalize-deps";
import { viteStaticCopy } from "vite-plugin-static-copy";

const mode = process.env.MODE;
if (mode !== undefined && mode !== "umd" && mode !== "esm-cdn") throw new Error(`Mode "${mode}" is not valid for build!`);

const umd = mode === "umd";
/** ES module for loading from a CDN: everything is bundled except the map library, which the page provides via an import map */
const esmCdn = mode === "esm-cdn";
/** Dependencies are bundled, only the map library stays external */
const bundled = umd || esmCdn;

const flavours: Record<string, LibraryOptions & ({ globals: GlobalsOption; umd?: never } | { globals?: never; umd: false })> = {
  index: {
    fileName: "index",
    entry: { index: "src/index.ts" },
    name: "maptilerGeocoder",
    globals: {},
  },
  leaflet: {
    fileName: "leaflet",
    entry: { leaflet: "src/leaflet.public.ts" },
    name: "maptilerGeocoder",
    globals: {
      leaflet: "L",
    },
  },
  maplibregl: {
    fileName: "maplibregl",
    entry: { maplibregl: "src/maplibregl.public.ts" },
    name: "maptilerGeocoder",
    umd: false, // MapLibre GL JS 6+ is ESM-only
  },
  maptilersdk: {
    fileName: "maptilersdk",
    entry: { maptilersdk: "src/maptilersdk.public.ts" },
    name: "maptilerGeocoder",
    globals: {
      "@maptiler/sdk": "maptilersdk",
    },
  },
  openlayers: {
    fileName: "openlayers",
    entry: { openlayers: "src/openlayers.public.ts" },
    name: "maptilerGeocoder",
    globals: (name) => (name.startsWith("ol") ? name.replace(/\.js$/, "").replaceAll("/", ".") : ""),
  },
};

const flavour = flavours[process.env.FLAVOUR!];
if (!process.env.FLAVOUR) throw new Error("No flavour specified for build!");
if (!flavour) throw new Error(`Flavour "${process.env.FLAVOUR}" is not valid for build!`);
if (umd && flavour.umd === false) throw new Error(`Flavour "${process.env.FLAVOUR}" has no UMD build!`);

export default defineConfig({
  plugins: [
    externalizeDeps({ deps: !bundled }),
    viteStaticCopy({ targets: [{ src: "icons", dest: "." }] }),
    !bundled && dts({ exclude: ["demos", "test", "vite.config*", "vitest-setup-tests.ts", "check-version.js"] }),
    esmCdn && {
      name: "minify-esm-cdn",
      renderChunk: {
        order: "post",
        async handler(code, chunk) {
          const result = await transformWithEsbuild(code, chunk.fileName, { minify: true, format: "esm", sourcemap: true });
          return { code: result.code, map: result.map };
        },
      },
    },
  ],
  publicDir: false,
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
              entryFileNames: esmCdn ? "[name].cdn.mjs" : "[name].js",
              chunkFileNames: esmCdn ? "[name].cdn.mjs" : "[name].js",
              assetFileNames: "[name].[ext]",
            },
      ],
    },
  },
});
