// Reexport your entry components here

import type { Map, IControl, MarkerOptions } from "maplibre-gl";
import Geocoding from "./Geocoding.svelte";
import type maplibregl1 from "maplibre-gl";

type Options = {
  apiKey: string;

  /**
   * A maplibre-gl instance to use when creating [Markers](https://maplibre.org/maplibre-gl-js-docs/api/markers/#marker).
   * Required if `options.marker` is `true`.
   */
  maplibregl?: typeof maplibregl1;

  /**
   * Sets the amount of time, in milliseconds, to wait before querying the server when a user types into the Geocoder input box.
   * This parameter may be useful for reducing the total number of API calls made for a single query.
   *
   * (optional, default `200`)
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
   * (optional, default `Search`)
   */
  placeholder?: string;

  /**
   * If true, the geocoder proximity will automatically update based on the map view.
   *
   * (optional, default `true`)
   */
  trackProximity?: boolean;

  /**
   * Minimum number of characters to enter before results are shown.
   *
   * (optional, default `2`)
   */
  minLength?: number;

  /**
   * A bounding box argument: this is a bounding box given as an array in the format [minX, minY, maxX, maxY].
   * Search results will be limited to the bounding box.
   */
  bbox?: number;

  /**
   * Maximum number of results to show.
   *
   * (optional, default `5`)
   */
  limit?: number;

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
   * (optional, default `false`)
   */
  showResultsWhileTyping?: boolean;

  /**
   * If `true`, a [Marker](https://maplibre.org/maplibre-gl-js-docs/api/markers/#marker) will be added to the map at the location of the user-selected result using a default set of Marker options.
   * If the value is an object, the marker will be constructed using these options.
   * If `false`, no marker will be added to the map.
   * Requires that `options.maplibregl` also be set.
   *
   * (optional, default `true`)
   */
  marker?: boolean | MarkerOptions;

  /**
   * If `true`, [Markers](https://maplibre.org/maplibre-gl-js-docs/api/markers/#marker) will be added to the map at the location the top results for the query.
   * If the value is an object, the marker will be constructed using these options.
   * If `false`, no marker will be added to the map.
   * Requires that `options.maplibregl` also be set.
   *
   * (optional, default `true`)
   */
  showResultMarkers?: boolean | MarkerOptions;

  // TODO - missing and useful from maplibre-gl-geocoder
  // zoom // On geocoded result what zoom level should the map animate to when a bbox isn't found in the response. If a bbox is found the map will fit to the bbox. (optional, default 16)
  // flyTo // (Boolean | Object) If false, animating the map to a selected result is disabled. If true, animating the map will use the default animation parameters. If an object, it will be passed as options to the map flyTo or fitBounds method providing control over the animation of the transition. (optional, default true)
  // collapsed // If true, the geocoder control will collapse until hovered or in focus. (optional, default false)
  // clearAndBlurOnEsc // If true, the geocoder control will clear it's contents and blur when user presses the escape key. (optional, default false)
  // clearOnBlur // If true, the geocoder control will clear its value when the input blurs. (optional, default false)
  // filter // A function which accepts a Feature in the Carmen GeoJSON format to filter out results from the Geocoding API response before they are included in the suggestions list. Return true to keep the item, false otherwise.
  // popup // If true, a Popup will be added to the map when clicking on a marker using a default set of popup options. If the value is an object, the popup will be constructed using these options. If false, no popup will be added to the map. Requires that options.maplibregl also be set. (optional, default true)
  // render // A function that specifies how the results should be rendered in the dropdown menu. This function should accepts a single Carmen GeoJSON object as input and return a string. Any HTML in the returned string will be rendered.
  // popupRender // A function that specifies how the results should be rendered in the popup menu. This function should accept a single Carmen GeoJSON object as input and return a string. Any HTML in the returned string will be rendered.
  // getItemValue // A function that specifies how the selected result should be rendered in the search bar. This function should accept a single Carmen GeoJSON object as input and return a string. HTML tags in the output string will not be rendered. Defaults to (item) => item.place_name.
};

export class GeocodingControl implements IControl {
  #gc?: Geocoding;

  #options: Options;

  constructor(options: Options) {
    this.#options = options;
  }

  onAdd(map: Map) {
    const div = document.createElement("div");

    div.className =
      "mapboxgl-ctrl-geocoder mapboxgl-ctrl maplibregl-ctrl-geocoder maplibregl-ctrl";

    this.#gc = new Geocoding({
      target: div,
      props: { map, ...this.#options },
    });

    return div;
  }

  onRemove() {
    this.#gc?.$destroy();
  }
}
