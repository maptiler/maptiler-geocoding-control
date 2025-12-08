import type { MaplibreglGeocodingControlOptions } from "./maplibregl-options";

export type MaptilerGeocodingControlOptions = Omit<MaplibreglGeocodingControlOptions, "apiKey"> & {
  /**
   * Maptiler API key.
   *
   * Default: The same API key as the connected map uses.
   */
  apiKey?: string;
};

export { DEFAULT_GEOMETRY_STYLE, RESULT_LAYER_FILL, RESULT_LAYER_LINE, RESULT_SOURCE, ZOOM_DEFAULTS, type FullGeometryStyle } from "./maplibregl-options";
