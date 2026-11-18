import { execSync } from "node:child_process";
import { globSync, rmSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const TSCONFIG = "./tsconfig.check-version.json";

/** @type {Record<string, {entrypoint: string, paths?: Record<string, string[]>}>} */
const checks = {
  "@maptiler/sdk": { entrypoint: "src/maptilersdk.ts" },
  "@maptiler/sdk@3.0": {
    entrypoint: "src/maptilersdk.ts",
    paths: {
      "@maptiler/sdk": ["../node_modules/@maptiler/sdk--v3.0/dist/maptiler-sdk.d.ts"],
      "maplibre-gl": ["../node_modules/@maptiler/sdk--v3.0/node_modules/maplibre-gl/dist/maplibre-gl.d.ts", "../node_modules/maplibre-gl/dist/maplibre-gl.d.ts"],
    },
  },
  "@maptiler/sdk@3.5": {
    entrypoint: "src/maptilersdk.ts",
    paths: {
      "@maptiler/sdk": ["../node_modules/@maptiler/sdk--v3.5/dist/maptiler-sdk.d.ts"],
      "maplibre-gl": ["../node_modules/@maptiler/sdk--v3.5/node_modules/maplibre-gl/dist/maplibre-gl.d.ts", "../node_modules/maplibre-gl/dist/maplibre-gl.d.ts"],
    },
  },
  "@maptiler/sdk@3.11": {
    entrypoint: "src/maptilersdk.ts",
    paths: {
      "@maptiler/sdk": ["../node_modules/@maptiler/sdk--v3.11/dist/maptiler-sdk.d.ts"],
      "maplibre-gl": ["../node_modules/@maptiler/sdk--v3.11/node_modules/maplibre-gl/dist/maplibre-gl.d.ts", "../node_modules/maplibre-gl/dist/maplibre-gl.d.ts"],
    },
  },
  "@maptiler/sdk@4.0": {
    entrypoint: "src/maptilersdk.ts",
    paths: {
      "@maptiler/sdk": ["../node_modules/@maptiler/sdk--v4.0/dist/maptiler-sdk.d.ts"],
      "maplibre-gl": ["../node_modules/@maptiler/sdk--v4.0/node_modules/maplibre-gl/dist/maplibre-gl.d.ts", "../node_modules/maplibre-gl/dist/maplibre-gl.d.ts"],
    },
  },
  "@maptiler/sdk@4.2": {
    entrypoint: "src/maptilersdk.ts",
    paths: {
      "@maptiler/sdk": ["../node_modules/@maptiler/sdk--v4.2/dist/maptiler-sdk.d.ts"],
      "maplibre-gl": ["../node_modules/@maptiler/sdk--v4.2/node_modules/maplibre-gl/dist/maplibre-gl.d.ts", "../node_modules/maplibre-gl/dist/maplibre-gl.d.ts"],
    },
  },
  "maplibre-gl": { entrypoint: "src/maplibregl.ts" },
  "maplibre-gl@5.0": { entrypoint: "src/maplibregl.ts", paths: { "maplibre-gl": ["../node_modules/maplibre-gl--v5.0/dist/maplibre-gl.d.ts"] } },
  "maplibre-gl@5.5": { entrypoint: "src/maplibregl.ts", paths: { "maplibre-gl": ["../node_modules/maplibre-gl--v5.5/dist/maplibre-gl.d.ts"] } },
  "maplibre-gl@5.10": { entrypoint: "src/maplibregl.ts", paths: { "maplibre-gl": ["../node_modules/maplibre-gl--v5.10/dist/maplibre-gl.d.ts"] } },
  "maplibre-gl@5.15": { entrypoint: "src/maplibregl.ts", paths: { "maplibre-gl": ["../node_modules/maplibre-gl--v5.15/dist/maplibre-gl.d.ts"] } },
  "maplibre-gl@5.20": { entrypoint: "src/maplibregl.ts", paths: { "maplibre-gl": ["../node_modules/maplibre-gl--v5.20/dist/maplibre-gl.d.ts"] } },
  "maplibre-gl@5.24": { entrypoint: "src/maplibregl.ts", paths: { "maplibre-gl": ["../node_modules/maplibre-gl--v5.24/dist/maplibre-gl.d.ts"] } },
  leaflet: { entrypoint: "src/leaflet.public.ts" },
  "leaflet@1.5": { entrypoint: "src/leaflet.public.ts", paths: { leaflet: ["../node_modules/@types/leaflet--v1.5/index.d.ts"] } },
  "leaflet@1.7": { entrypoint: "src/leaflet.public.ts", paths: { leaflet: ["../node_modules/@types/leaflet--v1.7/index.d.ts"] } },
  "leaflet@1.9": { entrypoint: "src/leaflet.public.ts", paths: { leaflet: ["../node_modules/@types/leaflet--v1.9/index.d.ts"] } },
  "leaflet@2.0-alpha": { entrypoint: "src/leaflet.public.ts", paths: { leaflet: ["../tmp/@types/leaflet-v2/index.d.ts"] } },
  ol: { entrypoint: "src/openlayers.public.ts" },
  "ol@v9.1": { entrypoint: "src/openlayers.public.ts", paths: { ol: ["../node_modules/ol--v9.1/index.d.ts"], "ol/*": ["../node_modules/ol--v9.1/*.d.ts"] } },
  "ol@v9.2": { entrypoint: "src/openlayers.public.ts", paths: { ol: ["../node_modules/ol--v9.2/index.d.ts"], "ol/*": ["../node_modules/ol--v9.2/*.d.ts"] } },
  "ol@v10.0": { entrypoint: "src/openlayers.public.ts", paths: { ol: ["../node_modules/ol--v10.0/index.d.ts"], "ol/*": ["../node_modules/ol--v10.0/*.d.ts"] } },
  "ol@v10.3": { entrypoint: "src/openlayers.public.ts", paths: { ol: ["../node_modules/ol--v10.3/index.d.ts"], "ol/*": ["../node_modules/ol--v10.3/*.d.ts"] } },
  "ol@v10.6": { entrypoint: "src/openlayers.public.ts", paths: { ol: ["../node_modules/ol--v10.6/index.d.ts"], "ol/*": ["../node_modules/ol--v10.6/*.d.ts"] } },
  "ol@v10.9": { entrypoint: "src/openlayers.public.ts", paths: { ol: ["../node_modules/ol--v10.9/index.d.ts"], "ol/*": ["../node_modules/ol--v10.9/*.d.ts"] } },
  "ol@v10.11": { entrypoint: "src/openlayers.public.ts", paths: { ol: ["../node_modules/ol--v10.11/index.d.ts"], "ol/*": ["../node_modules/ol--v10.11/*.d.ts"] } },
};

for (const [pkg, { entrypoint, paths = {} }] of Object.entries(checks)) {
  for (let [importName, importPaths] of Object.entries(paths)) {
    if (importPaths.every((path) => globSync(path, { cwd: dirname(entrypoint) }).length === 0)) {
      console.error("Path for import", importName, " not found in", pkg);
      process.exit(1);
    }
  }

  writeFileSync(
    TSCONFIG,
    JSON.stringify(
      {
        extends: "./tsconfig.json",
        compilerOptions: {
          types: [],
          paths,
        },
        include: [entrypoint, "src/*.d.ts"],
      },
      null,
      2,
    ),
    { encoding: "utf-8" },
  );

  try {
    execSync(`npx tsc -p ${TSCONFIG}`, { encoding: "utf-8" });
  } catch (err) {
    console.error("Error while checking", pkg);
    throw err;
  }
}

rmSync(TSCONFIG);
