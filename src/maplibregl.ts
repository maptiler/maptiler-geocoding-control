import type { Map } from "maplibre-gl";
import * as maplibregl from "maplibre-gl";
import {
  crateBaseClass,
  type MapLibreBaseControlOptions,
} from "./MapLibreBasedGeocodingControl";
export { createMapLibreGlMapController } from "./maplibregl-controller";

type Options = MapLibreBaseControlOptions & {
  /**
   * Maptiler API key. Optional if used with MapTiler SDK.
   */
  apiKey: string;
};

const Base = crateBaseClass(maplibregl.Evented, maplibregl);

export class GeocodingControl
  extends Base<Options>
  implements maplibregl.IControl
{
  onAdd(map: Map): HTMLElement {
    return super.onAddInt(map);
  }
}
