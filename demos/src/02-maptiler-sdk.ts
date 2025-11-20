import { Map, MapStyle } from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";

import { GeocodingControl } from "../../src/maptilersdk";

import { getApiKey } from "./demo-utils";

const map = new Map({
  container: "map",
  apiKey: getApiKey(),
  style: MapStyle.STREETS,
  hash: true,
  navigationControl: true,
});

const geocodingControl = new GeocodingControl({
  enableReverse: "button",
  collapsed: true,
  // pickedResultStyle: "full-geometry-including-polygon-center-marker",
  // limit: 20,
  // types: ["poi"],
  // fetchParameters: { credentials: "include" },
  // selectFirst: false,
  iconsBaseUrl: "/assets/icons/",
  proximity: [
    { type: "map-center", minZoom: 12 },
    { type: "client-geolocation", minZoom: 8 },
    { type: "server-geolocation", minZoom: 8 },
  ],
});

map.addControl(geocodingControl);

geocodingControl.on("featureslisted", (e) => {
  console.log(e);
});

map.addControl(
  new GeocodingControl({
    keepListOpen: true,
    enableReverse: "button",
    collapsed: false,
    pickedResultStyle: "full-geometry",
    types: ["locality"],
    fullGeometryStyle: true,
    iconsBaseUrl: "/assets/icons/",
  }),
  "top-left",
);
