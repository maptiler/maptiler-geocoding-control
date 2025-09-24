import type { Feature as FeatureType, Geometry } from "geojson";

export type BBox = [minx: number, miny: number, maxx: number, maxy: number];

export type Position = [x: number, y: number];

export type Feature<T extends Geometry = Geometry> = FeatureType<T> & {
  id: string;
  text: string;
  place_name: string;
  place_type: string[];
  place_type_name: string[];
  center: Position;
  bbox: BBox;
  address?: string;
  matching_text?: string;
};

export type FeatureCollection<T extends Geometry = Geometry> = {
  type: "FeatureCollection";
  features: Feature<T>[];
};

export type MapEvent =
  | { type: "mapClick"; coordinates: Position }
  | { type: "markerClick"; id: string }
  | { type: "markerMouseEnter"; id: string }
  | { type: "markerMouseLeave"; id: string };

export type MapController = {
  setEventHandler(handler: undefined | ((e: MapEvent) => void)): void;

  flyTo(center: Position, zoom?: number): void;

  fitBounds(bbox: BBox, padding: number, maxZoom?: number): void;

  indicateReverse(reverse: boolean): void;

  setFeatures(
    features: Feature[] | undefined,
    picked: Feature | undefined,
    showPolygonMarker: boolean,
  ): void;

  setReverseMarker(coordinates?: Position): void;

  setSelectedMarker(index: number): void;

  getCenterAndZoom(): [zoom: number, lon: number, lat: number] | undefined;
};

export type ProximityRule = {
  /** minimal map zoom for the rule to be used */
  minZoom?: number;

  /** maximal map zoom for the rule to be used */
  maxZoom?: number;
} & (
  | {
      /** fixed proximity */
      type: "fixed";

      /** coordinates of the fixed proximity */
      coordinates: Position;
    }
  | {
      /** use map center coordinates for the proximity */
      type: "map-center";
    }
  | {
      /** resolve proximity by geolocating IP of the geocoding API call */
      type: "server-geolocation";
    }
  | ({
      /** use browser's geolocation API for proximity. If it fails, following proximity rules are iterated. */
      type: "client-geolocation";

      /** how long should the geolocation result be cached, in milliseconds */
      cachedLocationExpiry?: number;
    } & PositionOptions)
);

export type ControlOptions = {
  /**
   * Callback function to adjust URL search parameters.
   *
   * Default: Empty function.
   *
   * @deprecated Use `adjustUrl` instead.
   */
  adjustUrlQuery?: (sp: URLSearchParams) => void;

  /**
   * Callback function to adjust the geocoding URL before fetching.
   *
   * @param url [URL](https://developer.mozilla.org/en-US/docs/Web/API/URL) parameter that can be modified.
   *
   * Default: Empty function.
   */
  adjustUrl?: (url: URL) => void;

  /**
   * MapTiler API key.
   */
  apiKey?: string;

  /**
   * Geocoding API URL.
   *
   * Default: MapTiler Geocoding API URL.
   */
  apiUrl?: string;

  /**
   * Bounding box in the format `[minX, minY, maxX, maxY]` to limit search results.
   *
   * Default: `undefined`.
   */
  bbox?: BBox;

  /**
   * CSS class for the root element.
   *
   * Default: `undefined`.
   */
  class?: string;

  /**
   * Title of the clear button.
   *
   * Default: `"clear"`.
   */
  clearButtonTitle?: string;

  /**
   * Clears the result list after picking an item.
   * Prevents redisplaying the list when the input box is focused.
   *
   * Default: `false`.
   */
  clearListOnPick?: boolean;

  /**
   * Clears the input value when it loses focus.
   *
   * Default: `false`.
   */
  clearOnBlur?: boolean;

  /**
   * Collapses the geocoder control until hovered or focused.
   *
   * Default: `false`.
   */
  collapsed?: boolean;

  /**
   * Limits search to the specified country or countries.
   *
   * Default: `undefined` (all countries).
   */
  country?: string | string[];

  /**
   * Time delay (in milliseconds) before querying the server after typing in the input box.
   * Useful for reducing the number of API calls.
   *
   * Default: `200`.
   */
  debounceSearch?: number;

  /**
   * Enables reverse geocoding:
   * - `"button"`: Enables reverse geocoding button.
   * - `"always"`: Reverse geocoding is always active.
   *
   * Default: `"never"`.
   */
  enableReverse?: EnableReverse;

  /**
   * Custom error message.
   *
   * Default: `"Something went wrong…"`.
   */
  errorMessage?: string;

  /**
   * Includes all available types except those listed in the `types` option.
   *
   * See `reverseGeocodingExcludeTypes` for reverse geocoding exclusion.
   *
   * Default: `false`.
   */
  excludeTypes?: boolean;

  /**
   * Uses the `limit` option value for reverse geocoding even if the `types` option has multiple elements.
   * Works only if enabled on the server.
   *
   * Default: `false`.
   */
  exhaustiveReverseGeocoding?: boolean;

  /**
   * Additional parameters for fetch requests.
   *
   * Default: `undefined`.
   */
  fetchParameters?: RequestInit;

  /**
   * Callback function to filter results from the Geocoding API response.
   * The function should return `true` to keep an item, or `false` to exclude it.
   *
   * Default: A function that always returns `true`.
   */
  filter?: (feature: Feature) => boolean;

  /**
   * Animates the map to the selected feature from the result list.
   *
   * Default: `false`.
   */
  flyToSelected?: boolean;

  /**
   * Enables fuzzy search.
   *
   * Default: `true`.
   */
  fuzzyMatch?: boolean;

  /**
   * Base URL for POI icons.
   *
   * Default:
   * - `"icons/"` for Svelte apps.
   * - `"https://cdn.maptiler.com/maptiler-geocoding-control/v${version}/icons/"` for others.
   */
  iconsBaseUrl?: string;

  /**
   * Keeps the result list open even if the control is unfocused.
   *
   * Default: `false`.
   */
  keepListOpen?: boolean;

  /**
   * Language for response text and query weighting.
   * Accepts IETF language tags.
   * Set to `null` or an empty string to disable language-specific searching.
   *
   * Default: `undefined` (uses the browser's language settings).
   */
  language?: string | string[] | null;

  /**
   * Maximum number of results to display.
   *
   * See `reverseGeocodingLimit` for reverse geocoding limits.
   *
   * Default: `5`.
   */
  limit?: number;

  /**
   * Displays a marker on the selected feature from the result list.
   *
   * Default: `true`.
   */
  markerOnSelected?: boolean;

  /**
   * Minimum number of characters required to start a search.
   *
   * Default: `2`.
   */
  minLength?: number;

  /**
   * Custom message for when no results are found.
   *
   * Default:
   * ```
   * "Oops! Looks like you're trying to predict something that's not quite right.
   * We can't seem to find what you're looking for. Maybe try double-checking your spelling or try a different search term.
   * Keep on typing - we'll do our best to get you where you need to go!"
   * ```
   */
  noResultsMessage?: string;

  /**
   * Style of the picked result on the map:
   * - `"marker-only"`: Show only a marker at the center of the feature.
   * - `"full-geometry"`: Display the full feature geometry.
   * - `"full-geometry-including-polygon-center-marker"`: Display full geometry with a marker at the polygon center.
   *
   * Default: `"full-geometry"`.
   */
  pickedResultStyle?: PickedResultStyle;

  /**
   * Custom placeholder for the input box.
   *
   * Default: `"Search"`.
   */
  placeholder?: string;

  /**
   * Prioritizes search results closer to a proximity point.
   * The first matching rule in the array is used.
   * Set to `null` to disable proximity.
   *
   * Default: `[ { type: "server-geolocation" } ]`.
   */
  proximity?: ProximityRule[] | null;

  /**
   * Activates reverse geocoding.
   *
   * Default: `false`.
   */
  reverseActive?: boolean;

  /**
   * Title of the reverse geocoding toggle button.
   *
   * Default: `"toggle reverse geocoding"`.
   */
  reverseButtonTitle?: string;

  /**
   * Excludes types for reverse geocoding.
   *
   * Default: Same as `excludeTypes`.
   */
  reverseGeocodingExcludeTypes?: boolean;

  /**
   * Limits results for reverse geocoding.
   * Applied only if value is 1 or effective types contain a single value.
   *
   * See also `reverseGeocodingTypes` option.
   *
   * Default: The value of the `limit` option if set. If effective types contain a single value, the default is `1`. In all other cases, this option is not used.
   */
  reverseGeocodingLimit?: number;

  /**
   * Specifies types for reverse geocoding.
   *
   * If effective types are multiple values, the `limit`/`reverseGeocodingLimit` option is ignored.
   *
   * See also `reverseGeocodingLimit` option.
   *
   * Default: Same as `types`.
   */
  reverseGeocodingTypes?: TypeRule[];

  /**
   * Automatically selects the first feature in the result list.
   *
   * Default: `true`.
   */
  selectFirst?: boolean;

  /**
   * Indicates when to show place/POI types in the dropdown:
   * - `"never"`: Hide the type.
   * - `"always"`: Always show the type.
   * - `"if-needed"`: Show the type only if it cannot be determined from the icon.
   *
   * Default: `"if-needed"`.
   */
  showPlaceType?: ShowPlaceType;

  /**
   * Displays results while typing:
   * - `false`: Search occurs only on pressing the Enter key.
   * - `true`: Search begins when the input meets the `minLength` requirement.
   *
   * Default: `true`.
   */
  showResultsWhileTyping?: boolean;

  /**
   * Types to query, either as an array or `[minZoom, maxZoom, type]` format.
   * `minZoom` is inclusive, `maxZoom` is exclusive, and either can be `null` or `undefined` for unbounded values.
   *
   * See `reverseGeocodingTypes` option for reverse geocoding types.
   *
   * Default: `undefined` (uses server default feature types).
   */
  types?: TypeRule[];

  /**
   * Specifies the zoom level to animate the map to for a geocoded result when no bounding box is present or when the result is a point.
   * If a bounding box is present and not a point, the map will fit to the bounding box.
   *
   * Values are key-value pairs where the key is a `<type>` or `<type>.<category>` and the value is the zoom level.
   *
   * Default: `GeocodingControl.ZOOM_DEFAULTS`.
   */
  zoom?: Record<string, number>;
};

export type PickedResultStyle =
  | "marker-only"
  | "full-geometry"
  | "full-geometry-including-polygon-center-marker";

export type EnableReverse = "never" | "always" | "button";

export type ShowPlaceType = "never" | "always" | "if-needed";

export type DispatcherTypeCC = {
  featuresListed: { features: Feature[] | undefined };
  featuresMarked: { features: Feature[] | undefined };
  optionsVisibilityChange: { optionsVisible: boolean };
  pick: { feature: Feature | undefined };
  queryChange: { query: string };
  response: { url: string; featureCollection: FeatureCollection };
  reverseToggle: { reverse: boolean };
  select: { feature: Feature | undefined };
};

export type DispatcherType = {
  [T in keyof DispatcherTypeCC as Lowercase<T>]: DispatcherTypeCC[T];
};

export type RedefineType<
  OriginalType,
  UpdatedType extends { [K in keyof OriginalType]: OriginalType[K] } & {
    [K in Exclude<keyof UpdatedType, keyof OriginalType>]: never;
  },
> = UpdatedType;

export type TypeRule =
  | string
  | [
      minZoom: number | null | undefined,
      maxZoom: number | null | undefined,
      type: string,
    ];
