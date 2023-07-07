import * as L from "leaflet";
import GeocodingControlComponent from "./GeocodingControl.svelte";
import { createLeafletMapController } from "./leaflet-controller";
import type { ControlOptions } from "./types";
export { createLeafletMapController } from "./leaflet-controller";

type LeafletControlOptions = ControlOptions &
  L.ControlOptions & {
    /**
     * If `true`, a [Marker](https://leafletjs.com/reference.html#marker) will be added to the map at the location of the user-selected result using a default set of Marker options.
     * If the value is an object, the marker will be constructed using these options.
     * If `false`, no marker will be added to the map.
     *
     * @default true
     */
    marker?: boolean | L.MarkerOptions;

    /**
     * If `true`, [Markers](https://leafletjs.com/reference.html#marker) will be added to the map at the location the top results for the query.
     * If the value is an object, the marker will be constructed using these options.
     * If `false`, no marker will be added to the map.
     *
     * @default true
     */
    showResultMarkers?: boolean | L.MarkerOptions;

    /**
     * If `false`, animating the map to a selected result is disabled.
     * If `true`, animating the map will use the default animation parameters.
     * If an object, it will be passed as options to the map `flyTo` or `fitBounds` method providing control over the animation of the transition.
     *
     * @default true
     */
    flyTo?: boolean | (L.ZoomPanOptions & L.FitBoundsOptions);

    /**
     * Style for full feature geometry GeoJSON.
     */
    fullGeometryStyle?: L.PathOptions | L.StyleFunction;
  };

export class GeocodingControl extends L.Control {
  #gc?: GeocodingControlComponent;

  #options: LeafletControlOptions;

  constructor(options: LeafletControlOptions) {
    super();

    this.#options = options;
  }

  onAdd(map: L.Map) {
    const div = document.createElement("div");

    div.className = "leaflet-ctrl-geocoder";

    L.DomEvent.disableClickPropagation(div);
    L.DomEvent.disableScrollPropagation(div);

    const {
      marker,
      showResultMarkers,
      flyTo,
      fullGeometryStyle,
      ...restOptions
    } = this.#options;

    const flyToOptions = typeof flyTo === "boolean" ? {} : flyTo;

    const mapController = createLeafletMapController(
      map,
      marker,
      showResultMarkers,
      flyToOptions,
      flyToOptions,
      fullGeometryStyle
    );

    this.#gc = new GeocodingControlComponent({
      target: div,
      props: {
        mapController,
        flyTo: flyTo === undefined ? true : !!flyTo,
        ...restOptions,
      },
    });

    for (const eventName of [
      "select",
      "pick",
      "featuresListed",
      "featuresMarked",
      "response",
      "optionsVisibilityChange",
      "reverseToggle",
      "queryChange",
    ]) {
      this.#gc.$on(eventName, (event) =>
        map.fire(eventName.toLowerCase(), event.detail)
      );
    }

    return div;
  }

  setOptions(options: LeafletControlOptions) {
    this.#options = options;

    const {
      marker,
      showResultMarkers,
      flyTo,
      fullGeometryStyle,
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

  onRemove() {
    this.#gc?.$destroy();
  }
}

function createControl(
  ...params: ConstructorParameters<typeof GeocodingControl>
) {
  return new GeocodingControl(...params);
}

if (
  window.L &&
  typeof window.L === "object" &&
  typeof window.L.control === "function"
) {
  (window.L.control as any).maptilerGeocoding = createControl;
}
