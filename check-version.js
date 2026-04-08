import { execSync } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";

const TSCONFIG = "./tsconfig.check-version.json";

const checks = [
  { entrypoint: "src/maptilersdk.ts" },
  {
    entrypoint: "src/maptilersdk.ts",
    paths: {
      "@maptiler/sdk": ["../node_modules/@maptiler/sdk--v3.0/dist/maptiler-sdk.d.ts"],
      "maplibre-gl": ["../node_modules/@maptiler/sdk--v3.0/node_modules/maplibre-gl/dist/maplibre-gl.d.ts", "../node_modules/maplibre-gl/dist/maplibre-gl.d.ts"],
    },
  },
  {
    entrypoint: "src/maptilersdk.ts",
    paths: {
      "@maptiler/sdk": ["../node_modules/@maptiler/sdk--v3.5/dist/maptiler-sdk.d.ts"],
      "maplibre-gl": ["../node_modules/@maptiler/sdk--v3.5/node_modules/maplibre-gl/dist/maplibre-gl.d.ts", "../node_modules/maplibre-gl/dist/maplibre-gl.d.ts"],
    },
  },
  {
    entrypoint: "src/maptilersdk.ts",
    paths: {
      "@maptiler/sdk": ["../node_modules/@maptiler/sdk--v3.11/dist/maptiler-sdk.d.ts"],
      "maplibre-gl": ["../node_modules/@maptiler/sdk--v3.11/node_modules/maplibre-gl/dist/maplibre-gl.d.ts", "../node_modules/maplibre-gl/dist/maplibre-gl.d.ts"],
    },
  },
  {
    entrypoint: "src/maptilersdk.ts",
    paths: {
      "@maptiler/sdk": ["../node_modules/@maptiler/sdk--v4.0/dist/maptiler-sdk.d.ts"],
      "maplibre-gl": ["../node_modules/@maptiler/sdk--v4.0/node_modules/maplibre-gl/dist/maplibre-gl.d.ts", "../node_modules/maplibre-gl/dist/maplibre-gl.d.ts"],
    },
  },
  { entrypoint: "src/maplibregl.ts" },
  { entrypoint: "src/maplibregl.ts", paths: { "maplibre-gl": ["../node_modules/maplibre-gl--v5.0/dist/maplibre-gl.d.ts"] } },
  { entrypoint: "src/maplibregl.ts", paths: { "maplibre-gl": ["../node_modules/maplibre-gl--v5.5/dist/maplibre-gl.d.ts"] } },
  { entrypoint: "src/maplibregl.ts", paths: { "maplibre-gl": ["../node_modules/maplibre-gl--v5.10/dist/maplibre-gl.d.ts"] } },
  { entrypoint: "src/maplibregl.ts", paths: { "maplibre-gl": ["../node_modules/maplibre-gl--v5.15/dist/maplibre-gl.d.ts"] } },
  { entrypoint: "src/maplibregl.ts", paths: { "maplibre-gl": ["../node_modules/maplibre-gl--v5.20/dist/maplibre-gl.d.ts"] } },
  { entrypoint: "src/leaflet.public.ts" },
  { entrypoint: "src/leaflet.public.ts", paths: { leaflet: ["../node_modules/@types/leaflet--v1.5/index.d.ts"] } },
  { entrypoint: "src/leaflet.public.ts", paths: { leaflet: ["../node_modules/@types/leaflet--v1.7/index.d.ts"] } },
  { entrypoint: "src/leaflet.public.ts", paths: { leaflet: ["../node_modules/@types/leaflet--v1.9/index.d.ts"] } },
  { entrypoint: "src/leaflet.public.ts", paths: { leaflet: ["../tmp/@types/leaflet-v2/index.d.ts"] } },
  { entrypoint: "src/openlayers.public.ts" },
  { entrypoint: "src/openlayers.public.ts", paths: { ol: ["../node_modules/ol--v9.0/index.d.ts"], "ol/*": ["../node_modules/ol--v9.0/*.d.ts"] } },
  { entrypoint: "src/openlayers.public.ts", paths: { ol: ["../node_modules/ol--v9.2/index.d.ts"], "ol/*": ["../node_modules/ol--v9.2/*.d.ts"] } },
  { entrypoint: "src/openlayers.public.ts", paths: { ol: ["../node_modules/ol--v10.0/index.d.ts"], "ol/*": ["../node_modules/ol--v10.0/*.d.ts"] } },
  { entrypoint: "src/openlayers.public.ts", paths: { ol: ["../node_modules/ol--v10.3/index.d.ts"], "ol/*": ["../node_modules/ol--v10.3/*.d.ts"] } },
  { entrypoint: "src/openlayers.public.ts", paths: { ol: ["../node_modules/ol--v10.6/index.d.ts"], "ol/*": ["../node_modules/ol--v10.6/*.d.ts"] } },
];

for (const { entrypoint, paths = {} } of checks) {
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

  execSync(`npx tsc -p ${TSCONFIG}`, { encoding: "utf-8" });
}

rmSync(TSCONFIG);
