import type { Map } from "ol";
import type { AnimationOptions, FitOptions } from "ol/View";
import { Control } from "ol/control";
import type { Options } from "ol/control/Control";
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

    const { flyTo, fullGeometryStyle, ...restOptions } = options;

    this.#gc = new GeocodingControlComponent({
      target: div,
      props: {
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
    ] as const) {
      this.#gc.$on(eventName, (event) => {
        switch (eventName) {
          case "select":
            this.dispatchEvent(
              new SelectEvent(event.detail as Feature | undefined),
            );
            break;
          case "featuresListed":
            this.dispatchEvent(
              new FeaturesListedEvent(event.detail as Feature[] | undefined),
            );
            break;
          case "featuresMarked":
            this.dispatchEvent(
              new FeaturesMarkedEvent(event.detail as Feature[] | undefined),
            );
            break;
          case "optionsVisibilityChange":
            this.dispatchEvent(
              new OptionsVisibilityChangeEvent(event.detail as boolean),
            );
            break;
          case "pick":
            this.dispatchEvent(
              new PickEvent(event.detail as Feature | undefined),
            );
            break;
          case "queryChange":
            this.dispatchEvent(new QueryChangeEvent(event.detail as string));
            break;
          case "response":
            this.dispatchEvent(
              new ResponseEvent(
                (event.detail as { url: string }).url,
                (
                  event.detail as { featureCollection: FeatureCollection }
                ).featureCollection,
              ),
            );
            break;
          case "reverseToggle":
            this.dispatchEvent(new ReverseToggleEvent(event.detail as boolean));
            break;
        }
      });
    }

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
        this.#options.showFullGeometry === "poly-with-marker",
      );

      this.#gc?.$set({ mapController });
    }
  }

  setOptions(options: OpenLayersControlOptions) {
    this.#options = options;

    const { flyTo, fullGeometryStyle, ...restOptions } = this.#options;

    this.#gc?.$set({
      ...restOptions,
      flyTo: flyTo === undefined ? true : !!flyTo,
    });
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
    super("featuresListed");

    this.features = features;
  }
}

export class FeaturesMarkedEvent extends BaseEvent {
  features: Feature[] | undefined;

  constructor(features: Feature[] | undefined) {
    super("featuresMarked");

    this.features = features;
  }
}

export class OptionsVisibilityChangeEvent extends BaseEvent {
  optionsVisible: boolean;

  constructor(optionsVisible: boolean) {
    super("optionsVisibilityChange");

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
    super("queryChange");

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
    super("reverseToggle");

    this.reverse = reverse;
  }
}
