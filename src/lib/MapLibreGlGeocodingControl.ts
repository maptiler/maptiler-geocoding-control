import type { Map } from "maplibre-gl";
import * as maplibregl from "maplibre-gl";
import type GeocodingControlComponent from "./GeocodingControl.svelte";
import {
  MapLibreBasedGeocodingControl,
  type MapLibreBaseControlOptions,
  type Props,
} from "./MapLibreBasedGeocodingControl";
export { createMapLibreGlMapController } from "./maplibreglMapController";

type Options = MapLibreBaseControlOptions & {
  /**
   * Maptiler API key. Optional if used with MapTiler SDK.
   */
  apiKey: string;
};

export class GeocodingControl extends MapLibreBasedGeocodingControl<Options> {
  getMapLibreGl(): typeof maplibregl {
    return maplibregl;
  }

  getExtraProps(
    _map: Map,
    _div: HTMLElement
  ): Partial<Props<GeocodingControlComponent>> {
    return {};
  }
}
