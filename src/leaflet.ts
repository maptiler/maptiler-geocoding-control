import * as L from "leaflet";
import GeocodingControlComponent from "./GeocodingControl.svelte";
import { createLeafletMapController } from "./leaflet-controller";
import type { ControlOptions, DispatcherType, Feature } from "./types";
export { createLeafletMapController } from "./leaflet-controller";

type LeafletControlOptions = ControlOptions &
  L.ControlOptions & {
    /**
     * Marker to be added to the map at the location of the user-selected result using a default set of Marker options.
     *
     * - If `true` or `undefined` then a default marker will be used.\
     * - If the value is [MarkerOptions](https://leafletjs.com/reference.html#marker-option) then the marker will be constructed using these options.
     * - If the value is a function then it can create and configure custom [Marker](https://leafletjs.com/reference.html#marker),
     *     add it to the [Map](https://leafletjs.com/reference.html#map) and return it.
     *   Function accepts [Map](https://leafletjs.com/reference.html#map) and `Feature` as parameters.
     *   Feature is `undefined` for the reverse location marker.
     * - If `false` or `null` then no marker will be added to the map.
     *
     * Default value is `true`.
     */
    marker?:
      | null
      | boolean
      | L.MarkerOptions
      | ((map: L.Map, feature?: Feature) => L.Marker | undefined | null);

    /**
     * Marker be added to the map at the location the geocoding results.
     *
     * - If `true` or `undefined` then a default marker will be used.
     * - If the value is [MarkerOptions](https://leafletjs.com/reference.html#marker-option) then the marker will be constructed using these options.
     * - If the value is a function then it can create and configure custom [Marker](https://leafletjs.com/reference.html#marker),
     *     add it to the [Map](https://leafletjs.com/reference.html#map) and return it.
     *   In this case the default pop-up won't be added to the marker.
     *   Function accepts [Map](https://leafletjs.com/reference.html#map) and `Feature` as parameters.
     * - If `false` or `null` then no marker will be added to the map.
     *
     * Default value is `true`.
     */
    showResultMarkers?:
      | null
      | boolean
      | L.MarkerOptions
      | ((map: L.Map, feature: Feature) => L.Marker | undefined | null);

    /**
     * Animation to selected feature on the map.
     *
     * - If `false` or `null` then animating the map to a selected result is disabled.
     * - If `true` or `undefined` then animating the map will use the default animation parameters.
     * - If an [ZoomPanOptions](https://leafletjs.com/reference.html#zoom/pan-options)
     *     ` & `[FitBoundsOptions](https://leafletjs.com/reference.html#fitbounds-options) then it will be passed as options
     *     to the map [flyTo](https://leafletjs.com/reference.html#map-flyto)
     *     or [fitBounds](https://leafletjs.com/reference.html#map-fitbounds) method providing control over the animation of the transition.
     *
     * Default value is `true`.
     */
    flyTo?: null | boolean | (L.ZoomPanOptions & L.FitBoundsOptions);

    /**
     * Style for the full feature geometry.
     *
     * - If `false` or `null` then no full geometry is drawn.
     * - If `true` or `undefined` then default-styled full geometry is drawn.
     * - If an [PathOptions](https://leafletjs.com/reference.html#path-option) then it will be used to style the full geometry.
     * - If a function accepting a `Feature` and returning [PathOptions](https://leafletjs.com/reference.html#path-option)
     *     then it must teturn the style and will be used to style the full geometry.
     */
    fullGeometryStyle?: null | boolean | L.PathOptions | L.StyleFunction;
  };

type LeafletEvent<T> = {
  type: T;
  target: GeocodingControl;
  sourceTarget: GeocodingControl;
};

type CustomEventMap = {
  [T in keyof DispatcherType]: DispatcherType[T] & LeafletEvent<T>;
};

/**
 * Leaflet mixins https://leafletjs.com/reference.html#class
 * for TypeScript https://www.typescriptlang.org/docs/handbook/mixins.html
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
class EventedControl extends L.Control {}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
interface EventedControl extends L.Control {
  on<T extends keyof CustomEventMap>(
    type: T,
    fn: (event: CustomEventMap[T]) => void,
    context?: unknown,
  ): this;

  addEventListener<T extends keyof CustomEventMap>(
    type: T,
    fn: (event: CustomEventMap[T]) => void,
    context?: unknown,
  ): this;

  once<T extends keyof CustomEventMap>(
    type: T,
    fn: (event: CustomEventMap[T]) => void,
    context?: unknown,
  ): this;

  addOneTimeEventListener<T extends keyof CustomEventMap>(
    type: T,
    fn: (event: CustomEventMap[T]) => void,
    context?: unknown,
  ): this;

  off<T extends keyof CustomEventMap>(
    type?: T,
    fn?: (event: CustomEventMap[T]) => void,
    context?: unknown,
  ): this;

  off(eventMap?: {
    [T in keyof CustomEventMap]?: (event: CustomEventMap[T]) => void;
  }): this;

  removeEventListener<T extends keyof CustomEventMap>(
    type?: T,
    fn?: (event: CustomEventMap[T]) => void,
    context?: unknown,
  ): this;

  listens<T extends keyof CustomEventMap>(
    type: T,
    fn: (event: CustomEventMap[T]) => void,
    context?: unknown,
    propagate?: boolean,
  ): boolean;

  fire(type: string, data?: unknown, propagate?: boolean): this;

  addEventParent(obj: L.Evented): this;

  removeEventParent(obj: L.Evented): this;

  fireEvent(type: string, data?: unknown, propagate?: boolean): this;

  hasEventListeners<T extends keyof CustomEventMap>(type: T): boolean;
}

L.Util.extend(EventedControl.prototype, L.Evented.prototype);

export class GeocodingControl extends EventedControl {
  #gc?: GeocodingControlComponent;

  #options: LeafletControlOptions;

  constructor(options: LeafletControlOptions) {
    super(options);

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
      position,
      ...restOptions
    } = this.#options;

    const flyToOptions = typeof flyTo === "boolean" ? {} : flyTo;

    const mapController = createLeafletMapController(
      map,
      marker,
      showResultMarkers,
      flyToOptions,
      flyToOptions,
      fullGeometryStyle,
      restOptions.pickedResultStyle ===
        "full-geometry-including-polygon-center-marker",
    );

    this.#gc = new GeocodingControlComponent({
      target: div,
      props: {
        mapController,
        flyTo: flyTo === undefined ? true : !!flyTo,
        ...restOptions,
      },
    });

    const eventNames: Record<keyof DispatcherType, undefined> = {
      select: undefined,
      pick: undefined,
      featureslisted: undefined,
      featuresmarked: undefined,
      response: undefined,
      optionsvisibilitychange: undefined,
      reversetoggle: undefined,
      querychange: undefined,
    };

    for (const eventName in eventNames) {
      this.#gc.$on(eventName, (event) => this.fire(eventName, event.detail));
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

  clearMap() {
    this.#gc?.clearMap();
  }

  clearList() {
    this.#gc?.clearList();
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
  (
    window.L.control as unknown as { maptilerGeocoding: typeof createControl }
  ).maptilerGeocoding = createControl;
}
