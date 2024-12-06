import type { Map } from "ol";
import type { ObjectEvent } from "ol/Object";
import type { CombinedOnSignature, EventTypes } from "ol/Observable";
import type { AnimationOptions, FitOptions } from "ol/View";
import { Control } from "ol/control";
import type { Options } from "ol/control/Control";
import type { EventsKey } from "ol/events";
import BaseEvent from "ol/events/Event";
import type { StyleLike } from "ol/style/Style";
import type { FlatStyleLike } from "ol/style/flat";
import GeocodingControlComponent from "./GeocodingControl.svelte";
import { createOpenLayersMapController } from "./openlayers-controller";
import type { ControlOptions, Feature, FeatureCollection } from "./types";
export { createOpenLayersMapController } from "./openlayers-controller";

type OpenLayersControlOptions = ControlOptions &
  Options & {
    flyTo?: boolean | (AnimationOptions & FitOptions);
    fullGeometryStyle?: StyleLike | FlatStyleLike;
  };

type CustomEventMap = {
  select: SelectEvent;
  featureslisted: FeaturesListedEvent;
  featuresmarked: FeaturesMarkedEvent;
  optionsvisibilitychange: OptionsVisibilityChangeEvent;
  pick: PickEvent;
  querychange: QueryChangeEvent;
  response: ResponseEvent;
  reversetoggle: ReverseToggleEvent;
};

type CustomObjectOnSignature<ReturnType> = {
  <K extends keyof CustomEventMap>(
    type: K,
    listener: (evt: CustomEventMap[K]) => void,
  ): ReturnType;
} & {
  (type: "propertychange", listener: (evt: ObjectEvent) => void): ReturnType;
} & CombinedOnSignature<
    EventTypes | "propertychange" | keyof CustomEventMap,
    ReturnType
  >;

export class GeocodingControl extends Control {
  #gc?: GeocodingControlComponent;

  #options: OpenLayersControlOptions;

  declare on: CustomObjectOnSignature<EventsKey>;
  declare once: CustomObjectOnSignature<EventsKey>;
  declare un: CustomObjectOnSignature<EventsKey>;

  constructor(options: OpenLayersControlOptions) {
    const div = document.createElement("div");

    div.className = "ol-search";

    super({
      element: div,
      target: options.target,
    });

    const { flyTo, fullGeometryStyle, ...restOptions } = options;

    this.#gc = new GeocodingControlComponent({
      target: div,
      props: {
        flyTo: flyTo === undefined ? true : !!flyTo,
        ...restOptions,
      },
    });

    this.#gc.$on("select", (event) => {
      this.dispatchEvent(new SelectEvent(event.detail.feature));
    });

    this.#gc.$on("pick", (event) => {
      this.dispatchEvent(new PickEvent(event.detail.feature));
    });

    this.#gc.$on("featureslisted", (event) => {
      this.dispatchEvent(new FeaturesListedEvent(event.detail.features));
    });

    this.#gc.$on("featuresmarked", (event) => {
      this.dispatchEvent(new FeaturesMarkedEvent(event.detail.features));
    });

    this.#gc.$on("response", (event) => {
      this.dispatchEvent(
        new ResponseEvent(event.detail.url, event.detail.featureCollection),
      );
    });

    this.#gc.$on("optionsvisibilitychange", (event) => {
      this.dispatchEvent(
        new OptionsVisibilityChangeEvent(event.detail.optionsVisible),
      );
    });

    this.#gc.$on("reversetoggle", (event) => {
      this.dispatchEvent(new ReverseToggleEvent(event.detail.reverse));
    });

    this.#gc.$on("querychange", (event) => {
      this.dispatchEvent(new QueryChangeEvent(event.detail.query));
    });

    this.#options = options;
  }

  setMap(map: Map | null): void {
    super.setMap(map);

    if (map) {
      const {
        // marker,
        // showResultMarkers,
        flyTo,
        fullGeometryStyle,
      } = this.#options;

      const mapController = createOpenLayersMapController(
        map,
        typeof flyTo === "boolean" ? undefined : flyTo,
        typeof flyTo === "boolean" ? undefined : flyTo,
        // marker,
        // showResultMarkers,
        fullGeometryStyle,
      );

      this.#gc?.$set({ mapController });
    }
  }

  /**
   * Update the control options.
   *
   * @param options options to update
   */
  setOptions(options: OpenLayersControlOptions) {
    Object.assign(this.#options, options);

    const { flyTo, fullGeometryStyle, ...restOptions } = this.#options;

    this.#gc?.$set({
      ...restOptions,
      flyTo: flyTo === undefined ? true : !!flyTo,
    });
  }

  /**
   * Set the content of search input box.
   *
   * @param value text to set
   * @param submit perform the search
   */
  setQuery(value: string, submit = true) {
    this.#gc?.setQuery(value, submit);
  }

  /**
   * Clear geocoding search results from the map.
   */
  clearMap() {
    this.#gc?.clearMap();
  }

  /**
   * Clear search result list.
   */
  clearList() {
    this.#gc?.clearList();
  }

  /**
   * Set reverse geocoding mode.
   *
   * @param reverseActive reverse geocoding active
   */
  setReverseMode(reverseActive: boolean) {
    this.#gc?.$set({ reverseActive });
  }

  /**
   * Focus the search input box.
   *
   * @param options [FocusOptions](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus#options)
   */
  focus(options?: FocusOptions) {
    this.#gc?.focus(options);
  }

  /**
   * Blur the search input box.
   */
  blur() {
    this.#gc?.blur();
  }

  // onRemove() {
  //   this.#gc?.$destroy();
  // }
}

export class SelectEvent extends BaseEvent {
  feature: Feature | undefined;

  constructor(feature: Feature | undefined) {
    super("select");

    this.feature = feature;
  }
}

export class FeaturesListedEvent extends BaseEvent {
  features: Feature[] | undefined;

  constructor(features: Feature[] | undefined) {
    super("featureslisted");

    this.features = features;
  }
}

export class FeaturesMarkedEvent extends BaseEvent {
  features: Feature[] | undefined;

  constructor(features: Feature[] | undefined) {
    super("featuresmarked");

    this.features = features;
  }
}

export class OptionsVisibilityChangeEvent extends BaseEvent {
  optionsVisible: boolean;

  constructor(optionsVisible: boolean) {
    super("optionsvisibilitychange");

    this.optionsVisible = optionsVisible;
  }
}

export class PickEvent extends BaseEvent {
  feature: Feature | undefined;

  constructor(feature: Feature | undefined) {
    super("pick");

    this.feature = feature;
  }
}

export class QueryChangeEvent extends BaseEvent {
  query: string;

  constructor(query: string) {
    super("querychange");

    this.query = query;
  }
}

export class ResponseEvent extends BaseEvent {
  url: string;

  featureCollection: FeatureCollection;

  constructor(url: string, featureCollection: FeatureCollection) {
    super("response");

    this.url = url;

    this.featureCollection = featureCollection;
  }
}

export class ReverseToggleEvent extends BaseEvent {
  reverse: boolean;

  constructor(reverse: boolean) {
    super("reversetoggle");

    this.reverse = reverse;
  }
}
