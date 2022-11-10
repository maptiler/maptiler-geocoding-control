export type Feature = GeoJSON.Feature & {
  id: string;
  text: string;
  place_name: string;
  place_type: string;
  center: [number, number];
  bbox: [number, number, number, number];
  address?: string;
};

export type FeatureCollection = {
  type: "FeatureCollection";
  features: Feature[];
};

export type MapController = {
  setProximityChangeHandler(
    proximityChangeHandler:
      | undefined
      | ((proximity: [number, number] | undefined) => void)
  ): void;

  setMapClickHandler(
    mapClickHandler: undefined | ((coordinates: [number, number]) => void)
  ): void;

  flyTo(center: [number, number], zoom: number): void;

  fitBounds(bbox: [number, number, number, number], padding: number): void;

  indicateReverse(reverse: boolean): void;

  setMarkers(
    features: Feature[] | undefined,
    picked: Feature | undefined
  ): void;

  setSelectedMarker(index: number): void;
};

export type Proximity = [number, number] | undefined;

export type ControlOptions = {
  /**
   * Maptiler API key
   */
  apiKey: string;

  /**
   * Sets the amount of time, in milliseconds, to wait before querying the server when a user types into the Geocoder input box.
   * This parameter may be useful for reducing the total number of API calls made for a single query.
   *
   * @default 200
   */
  debounceSearch?: number;

  /**
   * A proximity argument: this is a geographical point given as an object with latitude and longitude properties.
   * Search results closer to this point will be given higher priority.
   */
  proximity?: [number, number];

  /**
   * Override the default placeholder attribute value.
   *
   * @default "Search"
   */
  placeholder?: string;

  /**
   * Override the default error message.
   *
   * @default "Searching failed"
   */
  errorMessage?: string;

  /**
   * Override the default message if no results are found.
   *
   * @default "No results found"
   */
  noResultsMessage?: string;

  /**
   * If true, the geocoder proximity will automatically update based on the map view.
   *
   * @default true
   */
  trackProximity?: boolean;

  /**
   * Minimum number of characters to enter before results are shown.
   *
   * @default 2
   */
  minLength?: number;

  /**
   * A bounding box argument: this is a bounding box given as an array in the format [minX, minY, maxX, maxY].
   * Search results will be limited to the bounding box.
   */
  bbox?: [number, number, number, number];

  // /**
  //  * Maximum number of results to show.
  //  *
  //  * @default 5
  //  */
  // limit?: number;

  /**
   * Specify the language to use for response text and query result weighting.
   * Options are IETF language tags comprised of a mandatory ISO 639-1 language code and optionally one or more IETF subtags for country or script.
   * More than one value can also be specified, separated by commas.
   * Defaults to the browser's language settings.
   */
  language?: string;

  /**
   * If `false`, indicates that search will only occur on enter key press.
   * If `true`, indicates that the Geocoder will search on the input box being updated above the minLength option.
   *
   * @default false
   */
  showResultsWhileTyping?: boolean;

  // /**
  //  * Set to `false` to disable autocomplete.
  //  *
  //  * @default true
  //  */
  // autocomplete?: boolean;

  // /**
  //  * Set to `false` to disable fuzzy search.
  //  *
  //  * @default true
  //  */
  // fuzzy?: boolean;

  /**
   * On geocoded result what zoom level should the map animate to when a bbox isn't found in the response.
   * If a bbox is found the map will fit to the bbox.
   *
   * @default 16
   */
  zoom?: number;

  /**
   * If `true`, the geocoder control will collapse until hovered or in focus.
   *
   * @default false
   */
  collapsed?: boolean;

  // /**
  //  * If `true`, the geocoder control will clear it's contents and blur when user presses the escape key.
  //  *
  //  * @default false
  //  */
  // clearAndBlurOnEsc?: boolean;

  /**
   * If true, the geocoder control will clear its value when the input blurs.
   *
   * @default false
   */
  clearOnBlur?: boolean;

  /**
   * A function which accepts a Feature in the Carmen GeoJSON format to filter out results from the Geocoding API response before they are included in the suggestions list.
   * Return true to keep the item, false otherwise.
   */
  filter?: (feature: Feature) => boolean;

  /**
   * Class of the root element.
   */
  class?: string;

  /**
   * Set to `true` to enable reverse geocoding button with title _toggle reverse geocoding_ or set the button title directly.
   *
   * @default false
   */
  enableReverse?: boolean | string;

  /**
   * Set to `true` to show place type.
   *
   * @default false
   */
  showPlaceType?: boolean;

  // TODO - missing but useful from maplibre-gl-geocoder
  // popup // If true, a Popup will be added to the map when clicking on a marker using a default set of popup options. If the value is an object, the popup will be constructed using these options. If false, no popup will be added to the map. Requires that options.maplibregl also be set. (optional, default true)
  // render // A function that specifies how the results should be rendered in the dropdown menu. This function should accepts a single Carmen GeoJSON object as input and return a string. Any HTML in the returned string will be rendered.
  // popupRender // A function that specifies how the results should be rendered in the popup menu. This function should accept a single Carmen GeoJSON object as input and return a string. Any HTML in the returned string will be rendered.
  // getItemValue // A function that specifies how the selected result should be rendered in the search bar. This function should accept a single Carmen GeoJSON object as input and return a string. HTML tags in the output string will not be rendered. Defaults to (item) => item.place_name.
};
