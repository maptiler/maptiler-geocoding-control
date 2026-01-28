import type { GeocodingControlBase } from "./base-control";
import { MaplibreglGeocodingControl } from "./maplibregl-control";
import type { MaptilerGeocodingControlOptions } from "./maptilersdk-options";

export class MaptilerGeocodingControl extends MaplibreglGeocodingControl implements GeocodingControlBase<MaptilerGeocodingControlOptions> {
  constructor(options: MaptilerGeocodingControlOptions = {}) {
    super(options);
  }

  override setOptions(options: MaptilerGeocodingControlOptions) {
    super.setOptions(options);
  }
}
