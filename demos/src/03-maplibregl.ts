import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { MaplibreglGeocodingControl } from "../../src/maplibregl";

import { getApiKey } from "./demo-utils";

const map = new maplibregl.Map({
  container: "map",
  style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${getApiKey()}`,
  hash: true,
});

map.addControl(
  new MaplibreglGeocodingControl({
    apiKey: getApiKey(),
    keepListOpen: true,
    enableReverse: "button",
    collapsed: false,
    pickedResultStyle: "full-geometry",
    types: ["locality"],
    fullGeometryStyle: true,
  }),
  "top-right",
);

map.addControl(
  new MaplibreglGeocodingControl({
    apiKey: getApiKey(),
    keepListOpen: false,
    enableReverse: "button",
    collapsed: false,
    showResultsWhileTyping: false,
  }),
  "top-left",
);
