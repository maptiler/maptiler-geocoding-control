import { Evented, Marker, type MarkerOptions, type Map as MLMap, Popup, type PopupOptions } from "maplibre-gl";

import { mixinEvented } from "../utils/mixin-evented.js";
import { MaplibreglGeocodingControlBase } from "./maplibregl-control-base.js";
import type { MaplibreglGeocodingControlEventNameMap } from "./maplibregl-events.js";
import type { MaplibreglGeocodingControlOptions } from "./maplibregl-options.js";

export class MaplibreglGeocodingControl extends MaplibreglGeocodingControlBase<
  MaplibreglGeocodingControlOptions,
  MaplibreglGeocodingControlEventNameMap,
  MLMap,
  Marker,
  MarkerOptions
> {
  constructor(options: MaplibreglGeocodingControlOptions = {}) {
    super(options);
  }

  protected createMarker(options: MarkerOptions): Marker {
    return new Marker(options);
  }

  protected addMarker(map: MLMap, marker: Marker): void {
    marker.addTo(map);
  }

  protected setMarkerPopup(marker: Marker, options: PopupOptions, text: string): void {
    marker.setPopup(new Popup(options).setText(text));
  }
}

mixinEvented(MaplibreglGeocodingControl, Evented);
