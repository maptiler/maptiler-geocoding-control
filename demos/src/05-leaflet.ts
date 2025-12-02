import { control, map as LMap, Marker, Popup, tileLayer } from "leaflet";
import "leaflet/dist/leaflet.css";

import { GeocodingControl } from "../../src/leaflet.public";

import { getApiKey } from "./demo-utils";

const map = LMap("map", {
  center: [0, 0],
  zoom: 2,
  zoomControl: false,
});

tileLayer(`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${getApiKey()}`, {
  tileSize: 512,
  zoomOffset: -1,
  minZoom: 1,
  attribution:
    '\u003ca href="https://www.maptiler.com/copyright/" target="_blank"\u003e\u0026copy; MapTiler\u003c/a\u003e \u003ca href="https://www.openstreetmap.org/copyright" target="_blank"\u003e\u0026copy; OpenStreetMap contributors\u003c/a\u003e',
  crossOrigin: true,
}).addTo(map);

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

    const marker = new Marker({ lng: feature.center[0], lat: feature.center[1] })
      .bindPopup(new Popup({ closeButton: false }).setContent(feature.text))
      .addTo(map)
      .togglePopup();

    const element = marker.getElement();

    if (element) {
      element.style.cursor = "pointer";

      element.addEventListener("click", (e) => {
        marker.togglePopup();
        e.stopPropagation();
      });
    }

    return marker;
  },
  showResultMarkers(map, feature) {
    return new Marker({ lng: feature.center[0], lat: feature.center[1] })
      .bindPopup(new Popup({ closeButton: false }).setContent(feature.text))
      .addTo(map)
      .togglePopup();
  },
});

map.addControl(geocodingControl);

geocodingControl.on("featureslisted", (e) => {
  console.log(e);
});

map.addControl(
  new GeocodingControl({
    position: "topleft",
    apiKey: getApiKey(),
    keepListOpen: true,
    enableReverse: "button",
    collapsed: false,
    pickedResultStyle: "full-geometry",
    types: ["locality"],
    fullGeometryStyle: true,
    iconsBaseUrl: "/assets/icons/",
  }),
);

map.addControl(control.zoom({ position: "topright" }));
