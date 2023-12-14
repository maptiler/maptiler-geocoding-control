import type { Feature as FeatureType, Geometry } from "geojson";

export type BBox = [minx: number, miny: number, maxx: number, maxy: number];

export type Position = [x: number, y: number];

export type Feature<T extends Geometry = Geometry> = FeatureType<T> & {
  id: string;
  text: string;
  place_name: string;
  place_type: string[];
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

  flyTo(center: Position, zoom: number): void;

  fitBounds(bbox: BBox, padding: number, maxZoom: number): void;

  indicateReverse(reverse: boolean): void;

  setMarkers(
    features: Feature[] | undefined,
    picked: Feature | undefined,
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
   * Maptiler API key
   */
  apiKey: string;

  /**
   * Sets the amount of time, in milliseconds, to wait before querying the server when a user types into the Geocoder input box.
   * This parameter may be useful for reducing the total number of API calls made for a single query.
   * Default value is `200`.
   */
  debounceSearch?: number;

  /**
   * Search results closer to the proximity point will be given higher priority. First matching rule from the array will be used.
   * Set to `undefined` or `null` to disable proximity.
   * Default value is `[{ type: "server-geolocation" }]`.
   */
  proximity?: ProximityRule[] | null | undefined;

  /**
   * Override the default placeholder attribute value.
   * Default value is `"Search"`.
   */
  placeholder?: string;

  /**
   * Override the default error message.
   * Default value is `"Something went wrong…"`.
   */
  errorMessage?: string;

  /**
   * Override the default message if no results are found.
   * Default value is `"Oops! Looks like you're trying to predict something that's not quite right. We can't seem to find what you're looking for. Maybe try double-checking your spelling or try a different search term. Keep on typing - we'll do our best to get you where you need to go!"`.
   */
  noResultsMessage?: string;

  /**
   * Minimum number of characters to enter before results are shown.
   * Default value is `2`.
   */
  minLength?: number;

  /**
   * A bounding box argument: this is a bounding box given as an array in the format [minX, minY, maxX, maxY].
   * Search results will be limited to the bounding box.
   * Default value is `undefined`.
   */
  bbox?: BBox;

  /**
   * Maximum number of results to show.
   * Default value is `5`.
   */
  limit?: number;

  /**
   * Specify the language to use for response text and query result weighting.
   * Options are IETF language tags comprised of a mandatory ISO 639-1 language code and optionally one or more IETF subtags for country or script.
   * More than one value can also be specified, separated by commas.
   * Set to `null` or empty string for disabling language-specific searching.
   * Defaults to the browser's language settings.
   * Default value is `undefined`.
   */
  language?: string | string[] | null;

  /**
   * If `false`, indicates that search will only occur on enter key press.
   * If `true`, indicates that the Geocoder will search on the input box being updated above the minLength option.
   * Default value is `false`.
   */
  showResultsWhileTyping?: boolean;

  /**
   * Set to `false` to disable fuzzy search.
   * Default value is `true`
   */
  fuzzyMatch?: boolean;

  /**
   * On geocoded result what zoom level should the map animate to when a bbox isn't found in the response.
   * If a bbox is found the map will fit to the bbox.
   * Default value is `16`
   */
  zoom?: number;

  /**
   * On geocoded result what max zoom level should the map animate to when a bbox isn't found in the response. Used for small features.
   * If a bbox is found the map will fit to the bbox.
   * Default value is `18`.
   */
  maxZoom?: number;

  /**
   * If `true`, the geocoder control will collapse until hovered or in focus.
   * Default value is `false`.
   */
  collapsed?: boolean;

  // /**
  //  * If `true`, the geocoder control will clear it's contents and blur when user presses the escape key.
  //  * Default value is `false`.
  //  */
  // clearAndBlurOnEsc?: boolean;

  /**
   * If true, the geocoder control will clear its value when the input blurs.
   * Default value is `false`.
   */
  clearOnBlur?: boolean;

  /**
   * A function which accepts a Feature in the Carmen GeoJSON format to filter out results from the Geocoding API response before they are included in the suggestions list.
   * Return true to keep the item, false otherwise.
   */
  filter?: (feature: Feature) => boolean;

  /**
   * Class of the root element.
   * Default value is `undefined`.
   */
  class?: string;

  /**
   * Set to `true` to enable reverse geocoding button with title. Set to `"always"` to reverse geocoding be always active.
   * Default value is `false`
   */
  enableReverse?: boolean | "always";

  /**
   * Toggle reverse mode.
   * Default value is `false`.
   */
  reverseActive?: boolean;

  /**
   * Reverse toggle button title.
   * Default value is `"toggle reverse geocoding"`.
   */
  reverseButtonTitle?: string;

  /**
   * Clear button title.
   * Default value is `"clear"`.
   */
  clearButtonTitle?: string;

  /**
   * Set to `false` to hide place/POI type. If set to `"always"` then type is shown for all items.
   * If set to `"ifNeeded"` then type is shown only for places/POIs not determined from the icon.
   * Default value is `"ifNeeded"`.
   */
  showPlaceType?: false | "always" | "ifNeeded";

  /**
   * Set to `true` to show full feature geometry of the chosen result. Otherwise only marker will be shown.
   * Default value is `true`.
   */
  showFullGeometry?: boolean;

  /**
   * Limit search to specified country(ies).
   * Default value is `undefined` - use all countries.
   */
  country?: string | string[];

  /**
   * Filter of feature types to return.
   * Default value is `undefined` - all available feature types are returned.
   */
  types?: string[];

  /**
   * If set to `true` then use all types except for those listed in `types`.
   * Default value is `false`.
   */
  excludeTypes?: boolean;

  /**
   * Geocoding API URL.
   * Default value is MapTiler Geocoding API URL.
   */
  apiUrl?: string;

  /**
   * Extra fetch parameters.
   * Default value is `undefined`.
   */
  fetchParameters?: RequestInit;

  /**
   * Base URL for POI icons.
   * Default value is `"icons/"` for Svelte apps, otherwise `"https://cdn.maptiler.com/maptiler-geocoding-control/v${version}/icons/"`.
   */
  iconsBaseUrl?: string;

  /**
   * Function to adjust URL search parameters.
   * Default value is empty function.
   */
  adjustUrlQuery?: (sp: URLSearchParams) => void;

  /**
   * Automatically select the first feature from the result list.
   *
   * Default value is `true`.
   */
  selectFirst?: boolean;

  /**
   * Fly to selected feature from the result list.
   *
   * Default value is `false`.
   */
  flyToSelected?: boolean;

  /**
   * Show marker on the selected feature from the result list.
   *
   * Default value is `true`.
   */
  markerOnSelected?: boolean;

  // TODO - missing but useful from maplibre-gl-geocoder
  // popup // If true, a Popup will be added to the map when clicking on a marker using a default set of popup options. If the value is an object, the popup will be constructed using these options. If false, no popup will be added to the map. Requires that options.maplibregl also be set. (optional, default true)
  // render // A function that specifies how the results should be rendered in the dropdown menu. This function should accepts a single Carmen GeoJSON object as input and return a string. Any HTML in the returned string will be rendered.
  // popupRender // A function that specifies how the results should be rendered in the popup menu. This function should accept a single Carmen GeoJSON object as input and return a string. Any HTML in the returned string will be rendered.
  // getItemValue // A function that specifies how the selected result should be rendered in the search bar. This function should accept a single Carmen GeoJSON object as input and return a string. HTML tags in the output string will not be rendered. Defaults to (item) => item.place_name.
};

export type DispatcherType = {
  featuresListed: Feature[] | undefined;
  featuresMarked: Feature[] | undefined;
  optionsVisibilityChange: boolean;
  pick: Feature | undefined;
  queryChange: string;
  response: { url: string; featureCollection: FeatureCollection };
  reverseToggle: boolean;
  select: Feature | undefined;
};
