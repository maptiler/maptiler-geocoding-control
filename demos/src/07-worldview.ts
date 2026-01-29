import { Map, MapStyle } from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";

import { GeocodingControl, TypeRule } from "../../src/maptilersdk";

import { getApiKey } from "./demo-utils";

const map = new Map({
  container: "map",
  apiKey: getApiKey(),
  style: MapStyle.STREETS,
  hash: true,
  navigationControl: true,
});

const controls = [
  new GeocodingControl(),
  new GeocodingControl({
    worldview: "auto",
  }),
  new GeocodingControl({
    worldview: "ch",
  }),
  new GeocodingControl({
    worldview: "us",
  }),
];

for (const control of controls) {
  control.setOptions({
    keepListOpen: true,
    enableReverse: "button",
    iconsBaseUrl: "/assets/icons/",
    flyTo: false,
    limit: 1,
    fuzzyMatch: false,
  });
  map.addControl(control, "top-left");
}

map.addControl(
  {
    onAdd() {
      const select = document.createElement("select");
      select.className = "maplibregl-ctrl maplibregl-ctrl-group";
      select.innerHTML = `
        <option value="">Select a disputed feature:</option>
        <option value="Gulf of Mexico,continental_marine">Gulf of Mexico</option>
        <option value="مجلس الجولان الإقليمي,municipality">مجلس الجولان الإقليمي</option>
        <option value="حلائب,place">حلائب</option>
        <option value="أبيي,place">أبيي</option>
      `;
      select.addEventListener("change", () => {
        const [query, type] = select.value.split(",");
        for (const control of controls) {
          control.setOptions({ types: [type as TypeRule] });
          control.submitQuery(query);
          control.setOptions({ types: undefined });
        }
      });
      return select;
    },
    onRemove() {
      // empty
    },
  },
  "top-left",
);
