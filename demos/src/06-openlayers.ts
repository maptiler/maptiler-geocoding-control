import OLMap from "ol/Map";
import View from "ol/View";
import { defaults as defaultControls } from "ol/control.js";
import TileLayer from "ol/layer/Tile";
import "ol/ol.css";
import XYZ from "ol/source/XYZ";

import { GeocodingControl } from "../../src/openlayers.public";

import { getApiKey } from "./demo-utils";

const geocodingControl = new GeocodingControl({
  apiKey: getApiKey(),
  enableReverse: "button",
  collapsed: true,
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
  adjustUrl(url) {
    // for reverse geocoding use only address type
    if (/\/\d+\.?\d*%2C\d+.?\d*.json$/.test(url.pathname)) {
      url.searchParams.set("types", "address");
      url.searchParams.set("limit", "5");
    }
  },
});

geocodingControl.on("featureslisted", (e) => {
  console.log("featureslisted", e);
});
geocodingControl.on("markerclick", (e) => {
  console.log("markerclick", e);
});
geocodingControl.on("markermouseenter", (e) => {
  console.log("markermouseenter", e);
});
geocodingControl.on("markermouseleave", (e) => {
  console.log("markermouseleave", e);
});

new OLMap({
  target: "map",
  layers: [
    new TileLayer({
      source: new XYZ({
        url: `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${getApiKey()}`,
        tileSize: 512,
        attributions: [
          '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a>',
          '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
        ],
      }),
    }),
  ],
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
  controls: defaultControls().extend([
    geocodingControl,
    new GeocodingControl({
      apiKey: getApiKey(),
      keepListOpen: true,
      enableReverse: "button",
      collapsed: false,
      pickedResultStyle: "full-geometry",
      types: ["locality"],
      fullGeometryStyle: true,
      iconsBaseUrl: "/assets/icons/",
    }),
  ]),
});
