import * as maptilersdk from "@maptiler/sdk";
import type * as maplibregl from "maplibre-gl";
import type { Map } from "maplibre-gl";
import type GeocodingControlComponent from "./GeocodingControl.svelte";
import {
  MapLibreBasedGeocodingControl,
  type MapLibreBaseControlOptions,
  type Props,
} from "./MapLibreBasedGeocodingControl";
export { createMapLibreGlMapController } from "./maplibregl-controller";

export class GeocodingControl
  extends MapLibreBasedGeocodingControl<MapLibreBaseControlOptions>
  implements maptilersdk.IControl
{
  getMapLibreGl(): typeof maplibregl {
    return maptilersdk as any;
  }

  onAdd(map: maptilersdk.Map): HTMLElement {
    return super.onAddInt(map as unknown as maplibregl.Map);
  }

  getExtraProps(
    map: Map,
    div: HTMLElement,
  ): Partial<Props<GeocodingControlComponent>> {
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
  }
}
