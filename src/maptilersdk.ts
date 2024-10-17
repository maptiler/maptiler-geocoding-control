import * as maptilersdk from "@maptiler/sdk";
import type * as maplibregl from "maplibre-gl";
import type { Map } from "maplibre-gl";
import {
  crateBaseClass,
  type MapLibreBaseControlOptions,
} from "./MapLibreBasedGeocodingControl";
export { createMapLibreGlMapController } from "./maplibregl-controller";

const Base = crateBaseClass(
  maptilersdk.Evented,
  maptilersdk,
  (map: Map, div: HTMLElement) => {
    const sdkConfig: { apiKey?: string; language?: string } = {};

    if (!("getSdkConfig" in map && typeof map.getSdkConfig === "function")) {
      throw new Error("MapTiler SDK not detected");
    }

    const { primaryLanguage, apiKey } = map.getSdkConfig();

    sdkConfig.apiKey = apiKey;

    const match = /^([a-z]{2})($|_|-)/.exec(primaryLanguage);

    if (match) {
      sdkConfig.language = match[1];
    }

    div.className += " maptiler-ctrl";

    return sdkConfig;
  },
);

export class GeocodingControl
  extends Base<MapLibreBaseControlOptions>
  implements maptilersdk.IControl
{
  onAdd(map: maptilersdk.Map): HTMLElement {
    return super.onAddInt(map as unknown as maplibregl.Map);
  }
}
