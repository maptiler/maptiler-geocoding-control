import { Map, MapStyle } from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";

import { MaptilerGeocodingControl } from "../../src/maptilersdk";

import { getApiKey } from "./demo-utils";

const map = new Map({
  container: "map",
  apiKey: getApiKey(),
  style: MapStyle.BASIC,
  hash: true,
});

map.addControl(
  new MaptilerGeocodingControl({
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
  new MaptilerGeocodingControl({
    keepListOpen: false,
    enableReverse: "button",
    collapsed: false,
    showResultsWhileTyping: false,
  }),
  "top-left",
);
