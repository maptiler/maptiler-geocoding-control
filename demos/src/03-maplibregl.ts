import { Map, Marker, NavigationControl, Popup, setWorkerUrl } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";

import { GeocodingControl } from "../../src/maplibregl.public";

import { getApiKey } from "./demo-utils";

setWorkerUrl(workerUrl);

const map = new Map({
  container: "map",
  style: `https://api.maptiler.com/maps/streets/style.json?key=${getApiKey()}`,
  hash: true,
});

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
  marker(map, feature) {
    if (!feature) {
      return;
    }

    const marker = new Marker()
      .setLngLat(feature.center)
      .setPopup(new Popup({ closeButton: false }).setText(feature.text))
      .addTo(map)
      .togglePopup();

    const element = marker.getElement();

    element.style.cursor = "pointer";

    element.addEventListener("click", (e) => {
      marker.togglePopup();
      e.stopPropagation();
    });

    return marker;
  },
  showResultMarkers(map, feature) {
    return new Marker()
      .setLngLat(feature.center)
      .setPopup(new Popup({ closeButton: false }).setText(feature.text))
      .addTo(map)
      .togglePopup();
  },
});

map.addControl(geocodingControl);

geocodingControl.on("featureslisted", (e) => {
  console.log(e);
});

map.addControl(new NavigationControl());

map.addControl(
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
  "top-left",
);
