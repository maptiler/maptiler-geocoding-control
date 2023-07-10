import type { Map } from "ol";
import { Control } from "ol/control";
import type { Options } from "ol/control/Control";
import GeocodingControlComponent from "./GeocodingControl.svelte";
import { createOpenLayersMapController } from "./openlayers-controller";
import type { ControlOptions } from "./types";
export { createOpenLayersMapController } from "./openlayers-controller";

type OpenLayersControlOptions = ControlOptions & Options;

// & {
//   /**
//    * If `true`, a [Marker](https://leafletjs.com/reference.html#marker) will be added to the map at the location of the user-selected result using a default set of Marker options.
//    * If the value is an object, the marker will be constructed using these options.
//    * If `false`, no marker will be added to the map.
//    *
//    * @default true
//    */
//   marker?: boolean | L.MarkerOptions;

//   /**
//    * If `true`, [Markers](https://leafletjs.com/reference.html#marker) will be added to the map at the location the top results for the query.
//    * If the value is an object, the marker will be constructed using these options.
//    * If `false`, no marker will be added to the map.
//    *
//    * @default true
//    */
//   showResultMarkers?: boolean | L.MarkerOptions;

//   /**
//    * If `false`, animating the map to a selected result is disabled.
//    * If `true`, animating the map will use the default animation parameters.
//    * If an object, it will be passed as options to the map `flyTo` or `fitBounds` method providing control over the animation of the transition.
//    *
//    * @default true
//    */
//   flyTo?: boolean | (L.ZoomPanOptions & L.FitBoundsOptions);

//   /**
//    * Style for full feature geometry GeoJSON.
//    */
//   fullGeometryStyle?: L.PathOptions | L.StyleFunction;
// };

export class GeocodingControl extends Control {
  #gc?: GeocodingControlComponent;

  #options: OpenLayersControlOptions;

  constructor(options: OpenLayersControlOptions) {
    const div = document.createElement("div");

    div.className = "ol-search";

    super({
      element: div,
      target: options.target,
    });

    const {
      // marker,
      // showResultMarkers,
      // flyTo,
      // fullGeometryStyle,
      ...restOptions
    } = options;

    // const flyToOptions = typeof flyTo === "boolean" ? {} : flyTo;

    this.#gc = new GeocodingControlComponent({
      target: div,
      props: {
        // flyTo: flyTo === undefined ? true : !!flyTo,
        ...restOptions,
      },
    });

    // for (const eventName of [
    //   "select",
    //   "pick",
    //   "featuresListed",
    //   "featuresMarked",
    //   "response",
    //   "optionsVisibilityChange",
    //   "reverseToggle",
    //   "queryChange",
    // ]) {
    //   this.#gc.$on(eventName, (event) =>
    //     map.fire(eventName.toLowerCase(), event.detail)
    //   );
    // }

    this.#options = options;
  }

  setMap(map: Map | null): void {
    super.setMap(map);

    if (map) {
      const mapController = createOpenLayersMapController(
        map
        // marker,
        // showResultMarkers,
        // flyToOptions,
        // flyToOptions,
        // fullGeometryStyle
      );

      this.#gc?.$set({ mapController });
    }
  }

  setOptions(options: OpenLayersControlOptions) {
    this.#options = options;

    const {
      // marker,
      // showResultMarkers,
      // flyTo,
      // fullGeometryStyle,
      ...restOptions
    } = this.#options;

    this.#gc?.$set(restOptions);
  }

  setQuery(value: string, submit = true) {
    this.#gc?.setQuery(value, submit);
  }

  focus() {
    this.#gc?.focus();
  }

  blur() {
    this.#gc?.blur();
  }

  // onRemove() {
  //   this.#gc?.$destroy();
  // }
}
