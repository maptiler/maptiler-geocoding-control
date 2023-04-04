import type * as maplibregl from "maplibre-gl";
import type {
  FillLayerSpecification,
  FitBoundsOptions,
  FlyToOptions,
  IControl,
  LineLayerSpecification,
  Map,
  MarkerOptions,
} from "maplibre-gl";
import type { SvelteComponentTyped } from "svelte";
import GeocodingControlComponent from "./GeocodingControl.svelte";
import { createMapLibreGlMapController } from "./maplibregl-controller";
import type { ControlOptions } from "./types";
export { createMapLibreGlMapController } from "./maplibregl-controller";

export type MapLibreBaseControlOptions = Omit<ControlOptions, "apiKey"> & {
  /**
   * If `true`, a [Marker](https://maplibre.org/maplibre-gl-js-docs/api/markers/#marker) will be added to the map at the location of the user-selected result using a default set of Marker options.
   * If the value is an object, the marker will be constructed using these options.
   * If `false`, no marker will be added to the map.
   * Requires that `options.maplibregl` also be set.
   *
   * @default true
   */
  marker?: boolean | MarkerOptions;

  /**
   * If `true`, [Markers](https://maplibre.org/maplibre-gl-js-docs/api/markers/#marker) will be added to the map at the location the top results for the query.
   * If the value is an object, the marker will be constructed using these options.
   * If `false`, no marker will be added to the map.
   * Requires that `options.maplibregl` also be set.
   *
   * @default true
   */
  showResultMarkers?: boolean | MarkerOptions;

  /**
   * If `false`, animating the map to a selected result is disabled.
   * If `true`, animating the map will use the default animation parameters.
   * If an object, it will be passed as options to the map `flyTo` or `fitBounds` method providing control over the animation of the transition.
   *
   * @default true
   */
  flyTo?: boolean | (FlyToOptions & FitBoundsOptions);

  /**
   * Style for full feature geometry GeoJSON.
   */
  fullGeometryStyle?: {
    fill: Pick<FillLayerSpecification, "layout" | "paint" | "filter">;
    line: Pick<LineLayerSpecification, "layout" | "paint" | "filter">;
  };
};

export type Props<T> = T extends SvelteComponentTyped<infer P, any, any>
  ? P
  : never;

export abstract class MapLibreBasedGeocodingControl<
    T extends MapLibreBaseControlOptions
  >
  extends EventTarget
  implements IControl
{
  #gc?: GeocodingControlComponent;

  #options: T;

  constructor(options: T) {
    super();

    this.#options = options;
  }

  abstract getExtraProps(
    map: Map,
    div: HTMLElement
  ): Partial<Props<GeocodingControlComponent>>;

  onAdd(map: Map) {
    const div = document.createElement("div");

    div.className =
      "mapboxgl-ctrl-geocoder mapboxgl-ctrl maplibregl-ctrl-geocoder maplibregl-ctrl mapboxgl-ctrl-group";

    const {
      marker,
      showResultMarkers,
      flyTo,
      fullGeometryStyle,
      ...restOptions
    } = this.#options;

    const flyToOptions = typeof flyTo === "boolean" ? {} : flyTo;

    const extraConfig = this.getExtraProps(map, div);

    const mapController = createMapLibreGlMapController(
      map,
      this.getMapLibreGl(),
      marker,
      showResultMarkers,
      flyToOptions,
      flyToOptions,
      fullGeometryStyle
    );

    const props = {
      mapController,
      flyTo: flyTo === undefined ? true : !!flyTo,
      apiKey: "", // just to satisfy apiKey; TODO find a better solution
      ...extraConfig,
      ...restOptions,
    };

    if (!props.apiKey) {
      throw new Error("no apiKey provided");
    }

    this.#gc = new GeocodingControlComponent({ target: div, props });

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
      this.#gc.$on(eventName, (event) => this.dispatchEvent(event));
    }

    return div;
  }

  abstract getMapLibreGl(): typeof maplibregl;

  setOptions(options: T) {
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

  setReverseMode(value: boolean) {
    this.#gc?.$set({ reverseActive: value });
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
