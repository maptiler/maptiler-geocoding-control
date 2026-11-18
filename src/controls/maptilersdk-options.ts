import type { MapTilerMarkerElementOptions, MapTilerMarkerSVGOptions, Marker, Map as SDKMap } from "@maptiler/sdk";

import type { Feature } from "../types";
import type { MaplibreglGeocodingControlOptions } from "./maplibregl-options";

export type MaptilerGeocodingControlOptions = Omit<MaplibreglGeocodingControlOptions, "apiKey" | "marker" | "showResultMarkers"> & {
  /**
   * Maptiler API key.
   *
   * Default: The same API key as the connected map uses.
   */
  apiKey?: string;

  /**
   * Marker to be added to the map at the location of the user-selected result using a default set of Marker options.
   *
   * - If `true` or `undefined` then a default marker will be used.
   * - If the value is an object then the [Marker](https://docs.maptiler.com/sdk-js/api/markers/#marker) will be constructed using it as the options.
   * - If the value is a function then it can return instance of the [Marker](https://docs.maptiler.com/sdk-js/api/markers/#marker).
   *   Function can accept `Feature` as a parameter which is `undefined` for the reverse location marker.
   * - If `false` or `null` then no marker will be added to the map.
   *
   * Default value is `true`.
   */
  marker?: null | boolean | MapTilerMarkerElementOptions | MapTilerMarkerSVGOptions | ((map: SDKMap, feature?: Feature) => undefined | null | Marker);

  /**
   * Marker be added to the map at the location the geocoding results.
   *
   * - If `true` or `undefined` then a default marker will be used.
   * - If the value is an object then the [Marker](https://docs.maptiler.com/sdk-js/api/markers/#marker) will be constructed using it as the options.
   * - If the value is a function then it can return instance of the [Marker](https://docs.maptiler.com/sdk-js/api/markers/#marker).
   *   In this case the default pop-up won't be added to the marker.
   *   Function can accept `Feature` as a parameter.
   * - If `false` or `null` then no marker will be added to the map.
   *
   * Default value is `true`.
   */
  showResultMarkers?: null | boolean | MapTilerMarkerElementOptions | MapTilerMarkerSVGOptions | ((map: SDKMap, feature: Feature) => undefined | null | Marker);

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
