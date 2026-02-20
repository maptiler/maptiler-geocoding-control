import type { MaplibreglGeocodingControlOptions } from "./maplibregl-options";

export type MaptilerGeocodingControlOptions = Omit<MaplibreglGeocodingControlOptions, "apiKey"> & {
  /**
   * Maptiler API key.
   *
   * Default: The same API key as the connected map uses.
   */
  apiKey?: string;

  /**
   * Specifies whether the geocoder runs with a session logic.
   * A "session" is started at the initialization of the MapTiler SDK and finished when
   * the browser page is being closed or refreshed.
   * When this option is enabled, extra URL param `mtsid` is added to queries
   * to the MapTiler Cloud API. This allows MapTiler to enable "session based billing".
   *
   * Default: `true`.
   */
  session?: boolean;
};

export { DEFAULT_GEOMETRY_STYLE, RESULT_LAYER_FILL, RESULT_LAYER_LINE, RESULT_SOURCE, ZOOM_DEFAULTS, type FullGeometryStyle } from "./maplibregl-options";
