import type {
  Evented,
  FitBoundsOptions,
  FlyToOptions,
  Listener,
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
import type {
  ControlOptions,
  DispatcherType,
  DispatcherTypeCC,
  Feature,
  FeatureCollection,
  RedefineType,
} from "./types";
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
   * - If an T then it must represent the style and will be used to style the full geometry.
   *
   * Default is the default style.
   */
  fullGeometryStyle?: null | boolean | FullGeometryStyle;
};

export type Props<T> = T extends SvelteComponent<infer P> ? P : never;

type RemoveString<T> = T extends string ? never : T;

type Event$1 = RemoveString<Parameters<Evented["fire"]>[0]>;

type EventedConstructor = new (
  ...args: ConstructorParameters<typeof Evented>
) => Evented;

export function crateClasses<OPTS extends MapLibreBaseControlOptions>(
  Evented: EventedConstructor,
  maplibreGl: MapLibreGL,
  getExtraProps?: (
    map: Map,
    div: HTMLElement,
  ) => Partial<Props<GeocodingControlComponent>>,
) {
  type EventTypes = RedefineType<
    DispatcherType,
    {
      select: SelectEvent;
      featureslisted: FeaturesListedEvent;
      featuresmarked: FeaturesMarkedEvent;
      optionsvisibilitychange: OptionsVisibilityChangeEvent;
      pick: PickEvent;
      querychange: QueryChangeEvent;
      response: ResponseEvent;
      reversetoggle: ReverseToggleEvent;
    }
  >;

  // NOTE We can't use Maplibre `Event` - see https://github.com/maplibre/maplibre-gl-js/issues/5015
  class Event<TYPE extends string> implements Event$1 {
    readonly type: TYPE;
    readonly target: MapLibreBasedGeocodingControl;

    constructor(target: MapLibreBasedGeocodingControl, type: TYPE) {
      this.type = type;
      this.target = target;
    }
  }

  class SelectEvent extends Event<"select"> {
    feature: Feature | undefined;

    constructor(
      target: MapLibreBasedGeocodingControl,
      details: { feature: Feature | undefined },
    ) {
      super(target, "select");

      Object.assign(this, details);
    }
  }

  class FeaturesListedEvent extends Event<"featureslisted"> {
    features: Feature[] | undefined;

    constructor(
      target: MapLibreBasedGeocodingControl,
      features: Feature[] | undefined,
    ) {
      super(target, "featureslisted");

      this.features = features;
    }
  }

  class FeaturesMarkedEvent extends Event<"featuresmarked"> {
    features: Feature[] | undefined;

    constructor(
      target: MapLibreBasedGeocodingControl,
      features: Feature[] | undefined,
    ) {
      super(target, "featuresmarked");

      this.features = features;
    }
  }

  class OptionsVisibilityChangeEvent extends Event<"optionsvisibilitychange"> {
    optionsVisible: boolean;

    constructor(
      target: MapLibreBasedGeocodingControl,
      optionsVisible: boolean,
    ) {
      super(target, "optionsvisibilitychange");

      this.optionsVisible = optionsVisible;
    }
  }

  class PickEvent extends Event<"pick"> {
    feature: Feature | undefined;

    constructor(
      target: MapLibreBasedGeocodingControl,
      feature: Feature | undefined,
    ) {
      super(target, "pick");

      this.feature = feature;
    }
  }

  class QueryChangeEvent extends Event<"querychange"> {
    query: string;

    constructor(target: MapLibreBasedGeocodingControl, query: string) {
      super(target, "querychange");

      this.query = query;
    }
  }

  class ResponseEvent extends Event<"response"> {
    url: string;

    featureCollection: FeatureCollection;

    constructor(
      target: MapLibreBasedGeocodingControl,
      url: string,
      featureCollection: FeatureCollection,
    ) {
      super(target, "response");

      this.url = url;

      this.featureCollection = featureCollection;
    }
  }

  class ReverseToggleEvent extends Event<"reversetoggle"> {
    reverse: boolean;

    constructor(target: MapLibreBasedGeocodingControl, reverse: boolean) {
      super(target, "reversetoggle");

      this.reverse = reverse;
    }
  }

  class MapLibreBasedGeocodingControl extends Evented {
    #gc?: GeocodingControlComponent;

    #options: OPTS;

    constructor(options: OPTS = {} as OPTS) {
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

      this.#gc.$on("select", (event) => {
        this.fire(new SelectEvent(this, event.detail));
      });

      this.#gc.$on("pick", (event) => {
        this.fire(new PickEvent(this, event.detail.feature));
      });

      this.#gc.$on("featureslisted", (event) => {
        this.fire(new FeaturesListedEvent(this, event.detail.features));
      });

      this.#gc.$on("featuresmarked", (event) => {
        this.fire(new FeaturesMarkedEvent(this, event.detail.features));
      });

      this.#gc.$on("response", (event) => {
        this.fire(
          new ResponseEvent(
            this,
            event.detail.url,
            event.detail.featureCollection,
          ),
        );
      });

      this.#gc.$on("optionsvisibilitychange", (event) => {
        this.fire(
          new OptionsVisibilityChangeEvent(this, event.detail.optionsVisible),
        );
      });

      this.#gc.$on("reversetoggle", (event) => {
        this.fire(new ReverseToggleEvent(this, event.detail.reverse));
      });

      this.#gc.$on("querychange", (event) => {
        this.fire(new QueryChangeEvent(this, event.detail.query));
      });

      return div;
    }

    on<T extends keyof EventTypes>(
      type: T,
      listener: (ev: EventTypes[T]) => void,
    ): this;

    on(type: keyof EventTypes, listener: Listener): this {
      return super.on(type, listener);
    }

    once<T extends keyof EventTypes>(
      type: T,
      listener: (ev: EventTypes[T]) => void,
    ): this;

    once(type: keyof EventTypes, listener: Listener): this | Promise<unknown> {
      return super.once(type, listener);
    }

    off<T extends keyof EventTypes>(
      type: T,
      listener: (ev: EventTypes[T]) => void,
    ): this;

    off(type: keyof EventTypes, listener: Listener): this {
      return super.off(type, listener);
    }

    listens(type: keyof EventTypes): boolean;

    listens(type: keyof EventTypes): boolean {
      return super.listens(type);
    }

    setOptions(options: OPTS) {
      Object.assign(this.#options, options);

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
  }

  const events = {
    SelectEvent,
    FeaturesListedEvent,
    FeaturesMarkedEvent,
    OptionsVisibilityChangeEvent,
    PickEvent,
    QueryChangeEvent,
    ResponseEvent,
    ReverseToggleEvent,
  } satisfies {
    [T in keyof DispatcherTypeCC as `${Capitalize<T>}Event`]: unknown;
  };

  return {
    MapLibreBasedGeocodingControl,

    events,
  };
}
