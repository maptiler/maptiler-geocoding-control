import * as maptilersdk from "@maptiler/sdk";
import type * as maplibregl from "maplibre-gl";
import type { Map } from "maplibre-gl";
import { name, version } from "../package.json";
import {
  crateClasses,
  type MapLibreBaseControlOptions,
} from "./MapLibreBasedGeocodingControl";

export { createMapLibreGlMapController } from "./maplibregl-controller";

const { MapLibreBasedGeocodingControl, events } =
  crateClasses<MapLibreBaseControlOptions>(
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
  extends MapLibreBasedGeocodingControl
  implements maptilersdk.IControl
{
  onAdd(map: maptilersdk.Map): HTMLElement {
    map.telemetry?.registerModule(name, version);
    return super.onAddInt(map as unknown as maplibregl.Map);
  }
}

export const SelectEvent = events.SelectEvent;

export const FeaturesListedEvent = events.FeaturesListedEvent;

export const FeaturesMarkedEvent = events.FeaturesMarkedEvent;

export const OptionsVisibilityChangeEvent = events.OptionsVisibilityChangeEvent;

export const PickEvent = events.PickEvent;

export const QueryChangeEvent = events.QueryChangeEvent;

export const ResponseEvent = events.ResponseEvent;

export const ReverseToggleEvent = events.ReverseToggleEvent;
