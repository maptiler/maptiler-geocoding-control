import type {
  Map,
  IControl,
  MarkerOptions,
  FlyToOptions,
  FitBoundsOptions,
  FillLayerSpecification,
  LineLayerSpecification,
} from "maplibre-gl";
import * as maplibregl from "maplibre-gl";
import GeocodingControlComponent from "./GeocodingControl.svelte";
import type { ControlOptions } from "./types";
import { createMaplibreglMapController } from "./maplibreglMapController";
export { createMaplibreglMapController } from "./maplibreglMapController";
import * as maptilersdk from "@maptiler/sdk";

type MapLibreGL = Pick<typeof maplibregl, "Marker" | "Popup">;

type MapLibreControlOptions = Omit<ControlOptions, "apiKey"> & {
  /**
   * Maptiler API key. Optional if used with MapTiler SDK.
   */
  apiKey?: string;

  /**
   * A MapLibre GL instance to use when creating [Markers](https://maplibre.org/maplibre-gl-js-docs/api/markers/#marker).
   * Required if `options.marker` is `true`.
   */
  maplibregl?: MapLibreGL;

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

export class GeocodingControl extends EventTarget implements IControl {
  #gc?: GeocodingControlComponent;

  #options: MapLibreControlOptions;

  constructor(options: MapLibreControlOptions = {}) {
    super();

    this.#options = options;
  }

  onAdd(map: Map) {
    const div = document.createElement("div");

    div.className =
      "mapboxgl-ctrl-geocoder mapboxgl-ctrl maplibregl-ctrl-geocoder maplibregl-ctrl";

    const {
      marker,
      showResultMarkers,
      flyTo,
      fullGeometryStyle,
      ...restOptions
    } = this.#options;

    const flyToOptions = typeof flyTo === "boolean" ? {} : flyTo;

    const sdkConfig: { apiKey?: string; language?: string } = {};

    if ("getSdkConfig" in map && typeof map.getSdkConfig === "function") {
      const { primaryLanguage, apiKey } = map.getSdkConfig();

      sdkConfig.apiKey = apiKey;

      const match = /^([a-z]{2})($|_|-)/.exec(primaryLanguage);

      if (match) {
        sdkConfig.language = match[1];
      }
    }

    const mapController = createMaplibreglMapController(
      map,
      (maptilersdk as unknown as MapLibreGL | undefined) ??
        maplibregl ??
        this.#options.maplibregl,
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
      ...sdkConfig,
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

  setOptions(options: MapLibreControlOptions) {
    this.#options = options;

    const {
      maplibregl,
      marker,
      showResultMarkers,
      flyTo,
      fullGeometryStyle,
      ...restOptions
    } = this.#options;

    this.#gc?.$set(restOptions);
  }

  setQuery(value: string, submit: boolean | "always" = true) {
    (this.#gc as any)?.setQuery(value, submit);
  }

  setReverseMode(value: boolean) {
    this.#gc?.$set({ reverseActive: value });
  }

  focus() {
    (this.#gc as any)?.focus();
  }

  blur() {
    (this.#gc as any)?.blur();
  }

  onRemove() {
    (this.#gc as any)?.$destroy();
  }
}
