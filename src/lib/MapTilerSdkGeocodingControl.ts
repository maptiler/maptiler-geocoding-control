import * as maptilersdk from "@maptiler/sdk";
import type * as maplibregl from "maplibre-gl";
import type { Map } from "maplibre-gl";
import type GeocodingControlComponent from "./GeocodingControl.svelte";
import {
  MapLibreBasedGeocodingControl,
  type Props,
} from "./MapLibreBasedGeocodingControl";

export class GeocodingControl extends MapLibreBasedGeocodingControl {
  getMapLibre(): typeof maplibregl {
    return maptilersdk as any;
  }

  getExtraProps(
    map: Map,
    div: HTMLElement
  ): Partial<Props<GeocodingControlComponent>> {
    const sdkConfig: { apiKey?: string; language?: string } = {};

    if ("getSdkConfig" in map && typeof map.getSdkConfig === "function") {
      const { primaryLanguage, apiKey } = map.getSdkConfig();

      sdkConfig.apiKey = apiKey;

      const match = /^([a-z]{2})($|_|-)/.exec(primaryLanguage);

      if (match) {
        sdkConfig.language = match[1];
      }

      div.className += " maptiler-ctrl";
    }

    return sdkConfig;
  }
}
