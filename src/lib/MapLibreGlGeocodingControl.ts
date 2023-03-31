import type { Map } from "maplibre-gl";
import * as maplibregl from "maplibre-gl";
import type GeocodingControlComponent from "./GeocodingControl.svelte";
import {
  MapLibreBasedGeocodingControl,
  type Props,
} from "./MapLibreBasedGeocodingControl";
export { createMapLibreGlMapController } from "./maplibreglMapController";

export class GeocodingControl extends MapLibreBasedGeocodingControl {
  getMapLibre(): typeof maplibregl {
    return maplibregl;
  }

  getExtraProps(
    _map: Map,
    _div: HTMLElement
  ): Partial<Props<GeocodingControlComponent>> {
    return {};
  }
}
