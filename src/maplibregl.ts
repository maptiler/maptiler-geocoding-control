import type { Map } from "maplibre-gl";
import * as maplibregl from "maplibre-gl";
import {
  crateClasses,
  type MapLibreBaseControlOptions,
} from "./MapLibreBasedGeocodingControl";
export { createMapLibreGlMapController } from "./maplibregl-controller";

type Options = MapLibreBaseControlOptions & {
  /**
   * Maptiler API key. Optional if used with MapTiler SDK.
   */
  apiKey?: string;
};

const { MapLibreBasedGeocodingControl, events } = crateClasses<Options>(
  maplibregl.Evented,
  maplibregl,
);

export class GeocodingControl
  extends MapLibreBasedGeocodingControl
  implements maplibregl.IControl
{
  onAdd(map: Map): HTMLElement {
    return super.onAddInt(map);
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
