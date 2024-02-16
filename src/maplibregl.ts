import type { Map } from "maplibre-gl";
import * as maplibregl from "maplibre-gl";
import type GeocodingControlComponent from "./GeocodingControl.svelte";
import {
  MapLibreBasedGeocodingControl,
  type MapLibreBaseControlOptions,
  type Props,
} from "./MapLibreBasedGeocodingControl";
export { createMapLibreGlMapController } from "./maplibregl-controller";

type Options = MapLibreBaseControlOptions & {
  /**
   * Maptiler API key. Optional if used with MapTiler SDK.
   */
  apiKey: string;
};

export class GeocodingControl
  extends MapLibreBasedGeocodingControl<Options>
  implements maplibregl.IControl
{
  getMapLibreGl(): typeof maplibregl {
    return maplibregl;
  }

  onAdd(map: Map): HTMLElement {
    return super.onAddInt(map);
  }

  getExtraProps(
    _map: Map,
    _div: HTMLElement,
  ): Partial<Props<GeocodingControlComponent>> {
    return {};
  }
}
