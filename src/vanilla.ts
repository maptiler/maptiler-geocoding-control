import GeocodingControlComponent from "./GeocodingControl.svelte";
import type { ControlOptions, DispatcherType, MapController } from "./types";

const finalizationRegistry =
  new FinalizationRegistry<GeocodingControlComponent>((gc) => {
    gc.$destroy();
  });

type Options = ControlOptions & { mapController?: MapController };

interface GeocodingControlEvent<T> extends CustomEvent<T> {
  readonly target: GeocodingControl;
  readonly currentTarget: GeocodingControl;
}

type CustomEventListenerOrEventListenerObject<K extends keyof CustomEventMap> =
  | ((evt: CustomEventMap[K]) => void)
  | { handleEvent(object: CustomEventMap[K]): void };

type CustomEventMap = {
  [T in keyof DispatcherType]: GeocodingControlEvent<DispatcherType[T]>;
};

export class GeocodingControl extends EventTarget {
  #gc: GeocodingControlComponent;

  constructor({ target, ...options }: Options & { target: HTMLElement }) {
    super();

    this.#gc = new GeocodingControlComponent({
      target,
      props: options,
    });

    for (const eventName of [
      "select",
      "pick",
      "featureslisted",
      "featuresmarked",
      "response",
      "optionsvisibilitychange",
      "reversetoggle",
      "querychange",
    ] as const) {
      this.#gc.$on(eventName, (event) => {
        // Use the new `emit` method for type-safe dispatching
        this.#emit(eventName, event.detail);
      });
    }

    this.#gc.$on("select", (event) => {
      const geocodingEvent = new CustomEvent(event.type, {
        detail: event.detail,
      }) as GeocodingControlEvent<CustomEventMap["select"]["detail"]>;

      this.dispatchEvent(geocodingEvent);
    });

    finalizationRegistry.register(this, this.#gc);
  }

  /**
   * Update the control options.
   *
   * @param options options to update
   */
  setOptions(options: Partial<Options>) {
    this.#gc.$set(options);
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

  addEventListener<K extends keyof CustomEventMap>(
    type: K,
    callback: CustomEventListenerOrEventListenerObject<K> | null,
    options?: AddEventListenerOptions | boolean,
  ): void;

  addEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: AddEventListenerOptions | boolean,
  ): void {
    super.addEventListener(type, callback, options);
  }

  removeEventListener<K extends keyof CustomEventMap>(
    type: K,
    callback: CustomEventListenerOrEventListenerObject<K> | null,
    options?: EventListenerOptions | boolean,
  ): void;

  removeEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: EventListenerOptions | boolean,
  ): void {
    super.removeEventListener(type, callback, options);
  }

  dispatchEvent<K extends keyof CustomEventMap>(
    event: CustomEventMap[K],
  ): boolean;

  dispatchEvent(event: Event): boolean {
    return super.dispatchEvent(event);
  }

  #emit<K extends keyof CustomEventMap>(
    type: K,
    detail: CustomEventMap[K]["detail"],
  ): boolean {
    return super.dispatchEvent(
      new CustomEvent(type, {
        detail,
      }) as GeocodingControlEvent<CustomEventMap[K]["detail"]>,
    );
  }
}
