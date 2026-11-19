import { execSync } from "node:child_process";
import { globSync, rmSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const TSCONFIG = "./tsconfig.check-version.json";

/** @type {Record<string, {entrypoint: string, paths?: Record<string, string[]>}>} */
const checks = {
  "@maptiler/sdk": { entrypoint: "src/maptilersdk.ts" },
  "@maptiler/sdk@5.0": {
    entrypoint: "src/maptilersdk.ts",
    paths: {
      "@maptiler/sdk": ["../node_modules/@maptiler/sdk--v5.0/dist/maptiler-sdk.d.ts"],
      "maplibre-gl": ["../node_modules/@maptiler/sdk--v5.0/node_modules/maplibre-gl/dist/maplibre-gl.d.ts", "../node_modules/maplibre-gl/dist/maplibre-gl.d.ts"],
    },
  },
  "maplibre-gl": { entrypoint: "src/maplibregl.ts" },
  "maplibre-gl@6.0": { entrypoint: "src/maplibregl.ts", paths: { "maplibre-gl": ["../node_modules/maplibre-gl--v6.0/dist/maplibre-gl.d.ts"] } },
  "maplibre-gl@6.5": { entrypoint: "src/maplibregl.ts", paths: { "maplibre-gl": ["../node_modules/maplibre-gl--v6.5/dist/maplibre-gl.d.ts"] } },
  "maplibre-gl@6.10": { entrypoint: "src/maplibregl.ts", paths: { "maplibre-gl": ["../node_modules/maplibre-gl--v6.10/dist/maplibre-gl.d.ts"] } },
  "maplibre-gl@6.15": { entrypoint: "src/maplibregl.ts", paths: { "maplibre-gl": ["../node_modules/maplibre-gl--v6.15/dist/maplibre-gl.d.ts"] } },
  "maplibre-gl@6.19": { entrypoint: "src/maplibregl.ts", paths: { "maplibre-gl": ["../node_modules/maplibre-gl--v6.19/dist/maplibre-gl.d.ts"] } },
  leaflet: { entrypoint: "src/leaflet.public.ts" },
  "leaflet@2.0-beta.1": { entrypoint: "src/leaflet.public.ts", paths: { leaflet: ["../node_modules/leaflet--v2.0-beta.1/dist/types/index.d.ts"] } },
  "leaflet@2.0-beta.2": { entrypoint: "src/leaflet.public.ts", paths: { leaflet: ["../node_modules/leaflet--v2.0-beta.2/dist/types/index.d.ts"] } },
  "leaflet@2.0-beta.3": { entrypoint: "src/leaflet.public.ts", paths: { leaflet: ["../node_modules/leaflet--v2.0-beta.3/dist/types/index.d.ts"] } },
  "leaflet@2.0-beta": { entrypoint: "src/leaflet.public.ts", paths: { leaflet: ["../node_modules/leaflet--v2.0-beta/dist/types/index.d.ts"] } },
  ol: { entrypoint: "src/openlayers.public.ts" },
  "ol@v9.1": { entrypoint: "src/openlayers.public.ts", paths: { ol: ["../node_modules/ol--v9.1/index.d.ts"], "ol/*": ["../node_modules/ol--v9.1/*"] } },
  "ol@v9.2": { entrypoint: "src/openlayers.public.ts", paths: { ol: ["../node_modules/ol--v9.2/index.d.ts"], "ol/*": ["../node_modules/ol--v9.2/*"] } },
  "ol@v10.0": { entrypoint: "src/openlayers.public.ts", paths: { ol: ["../node_modules/ol--v10.0/index.d.ts"], "ol/*": ["../node_modules/ol--v10.0/*"] } },
  "ol@v10.3": { entrypoint: "src/openlayers.public.ts", paths: { ol: ["../node_modules/ol--v10.3/index.d.ts"], "ol/*": ["../node_modules/ol--v10.3/*"] } },
  "ol@v10.6": { entrypoint: "src/openlayers.public.ts", paths: { ol: ["../node_modules/ol--v10.6/index.d.ts"], "ol/*": ["../node_modules/ol--v10.6/*"] } },
  "ol@v10.9": { entrypoint: "src/openlayers.public.ts", paths: { ol: ["../node_modules/ol--v10.9/index.d.ts"], "ol/*": ["../node_modules/ol--v10.9/*"] } },
  "ol@v10.11": { entrypoint: "src/openlayers.public.ts", paths: { ol: ["../node_modules/ol--v10.11/index.d.ts"], "ol/*": ["../node_modules/ol--v10.11/*"] } },
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
