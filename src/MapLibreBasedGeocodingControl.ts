import type {
  Evented,
  FitBoundsOptions,
  FlyToOptions,
  Map,
  Marker,
  MarkerOptions,
} from "maplibre-gl";
import type { SvelteComponent } from "svelte";
import GeocodingControlComponent from "./GeocodingControl.svelte";
import {
  createMapLibreGlMapController,
  type FullGeometryStyle,
  type MapLibreGL,
} from "./maplibregl-controller";
import type { ControlOptions, Feature } from "./types";
export {
  createMapLibreGlMapController,
  type MapLibreGL,
} from "./maplibregl-controller";

export type MapLibreBaseControlOptions = Omit<ControlOptions, "apiKey"> & {
  /**
   * Marker to be added to the map at the location of the user-selected result using a default set of Marker options.
   *
   * - If `true` or `undefined` then a default marker will be used.
   * - If the value is a [MarkerOptions](https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MarkerOptions/) then the marker will be constructed using these options.
   * - If the value is a function then it can return instance of the [Marker](https://maplibre.org/maplibre-gl-js/docs/API/classes/Marker/).
   *   Function can accept `Feature` as a parameter which is `undefined` for the reverse location marker.
   * - If `false` or `null` then no marker will be added to the map.
   *
   * Requires that `options.maplibregl` also be set.
   *
   * Default value is `true`.
   */
  marker?:
    | null
    | boolean
    | MarkerOptions
    | ((map: Map, feature?: Feature) => undefined | null | Marker);

  /**
   * Marker be added to the map at the location the geocoding results.
   *
   * - If `true` or `undefined` then a default marker will be used.
   * - If the value is a [MarkerOptions](https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MarkerOptions/) then the marker will be constructed using these options.
   * - If the value is a function then it can return instance of the [Marker](https://maplibre.org/maplibre-gl-js/docs/API/classes/Marker/).
   *   In this case the default pop-up won't be added to the marker.
   *   Function can accept `Feature` as a parameter.
   * - If `false` or `null` then no marker will be added to the map.
   *
   * Requires that `options.maplibregl` also be set.
   *
   * Default value is `true`.
   */
  showResultMarkers?:
    | null
    | boolean
    | MarkerOptions
    | ((map: Map, feature: Feature) => undefined | null | Marker);

  /**
   * Animation to selected feature on the map.
   *
   * - If `false` or `null` then animating the map to a selected result is disabled.
   * - If `true` or `undefined` then animating the map will use the default animation parameters.
   * - If an [FlyToOptions](https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/FlyToOptions/)
   *     ` & `[FitBoundsOptions](https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/FitBoundsOptions/)
   *     then it will be passed as options to the map [flyTo](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/#flyto)
   *     or [fitBounds](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/#fitbounds) method providing control over the animation of the transition.
   *
   * Default value is `true`.
   */
  flyTo?: null | boolean | (FlyToOptions & FitBoundsOptions);

  /**
   * Style for full feature geometry GeoJSON.
   *
   * - If `false` or `null` then no full geometry is drawn.
   * - If `true` or `undefined` then default-styled full geometry is drawn.
   * - If an object then it must represent the style and will be used to style the full geometry.
   *
   * Default is the default style.
   */
  fullGeometryStyle?: null | boolean | FullGeometryStyle;
};

export type Props<T> = T extends SvelteComponent<infer P> ? P : never;

type EventedConstructor = new (
  ...args: ConstructorParameters<typeof Evented>
) => Evented;

export function crateBaseClass(
  Evented: EventedConstructor,
  maplibreGl: MapLibreGL,
  getExtraProps?: (
    map: Map,
    div: HTMLElement,
  ) => Partial<Props<GeocodingControlComponent>>,
) {
  return class MapLibreBasedGeocodingControl<
    T extends MapLibreBaseControlOptions,
  > extends Evented {
    #gc?: GeocodingControlComponent;

    #options: T;

    constructor(options: T = {} as T) {
      super();

      this.#options = options;
    }

    onAddInt(map: Map): HTMLElement {
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

      const mapController = createMapLibreGlMapController(
        map,
        maplibreGl,
        marker,
        showResultMarkers,
        flyToOptions,
        flyToOptions,
        fullGeometryStyle,
        restOptions.showFullGeometry === "polygon-with-marker",
      );

      const props = {
        mapController,
        flyTo: flyTo === undefined ? true : !!flyTo,
        apiKey: "", // just to satisfy apiKey; TODO find a better solution
        ...getExtraProps?.(map, div),
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
      ] as const) {
        this.#gc.$on(eventName, (event) => {
          this.fire(eventName, event.detail);
        });
      }

      return div;
    }

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

    clearMap() {
      this.#gc?.clearMap();
    }

    clearList() {
      this.#gc?.clearList();
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
  };
}
