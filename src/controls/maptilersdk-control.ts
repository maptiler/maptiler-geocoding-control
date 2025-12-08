import { MaplibreglGeocodingControl } from "./maplibregl-control";
import type { MaptilerGeocodingControlOptions } from "./maptilersdk-options";

export class MaptilerGeocodingControl extends MaplibreglGeocodingControl {
  constructor(options: MaptilerGeocodingControlOptions = {}) {
    super(options);
  }

  override setOptions(options: MaptilerGeocodingControlOptions) {
    super.setOptions(options);
  }
}
