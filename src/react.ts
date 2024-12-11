import {
  createElement,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type Ref,
} from "react";
import GeocodingControl from "./GeocodingControl.svelte";
import type { ControlOptions, DispatcherTypeCC, MapController } from "./types";

type EventNames = keyof DispatcherTypeCC;

type EventHandlerFnName<T extends EventNames> = `on${Capitalize<T>}`;

type CallbackProperties<T> = {
  [K in keyof T as EventHandlerFnName<Extract<K, EventNames>>]?: (
    event: T[K],
  ) => void;
};

const eventNames = [
  "featuresListed",
  "featuresMarked",
  "optionsVisibilityChange",
  "pick",
  "queryChange",
  "response",
  "reverseToggle",
  "select",
] as const satisfies readonly EventNames[];

type MapControllerProp = {
  mapController?: MapController;
};

const propertyNames = [
  "adjustUrlQuery",
  "adjustUrl",
  "apiKey",
  "apiUrl",
  "bbox",
  "class",
  "clearButtonTitle",
  "clearListOnPick",
  "clearOnBlur",
  "collapsed",
  "country",
  "debounceSearch",
  "enableReverse",
  "errorMessage",
  "excludeTypes",
  "exhaustiveReverseGeocoding",
  "fetchParameters",
  "filter",
  "flyToSelected",
  "fuzzyMatch",
  "iconsBaseUrl",
  "keepListOpen",
  "language",
  "limit",
  "mapController",
  "markerOnSelected",
  "minLength",
  "noResultsMessage",
  "pickedResultStyle",
  "placeholder",
  "proximity",
  "reverseActive",
  "reverseButtonTitle",
  "selectFirst",
  "showPlaceType",
  "showResultsWhileTyping",
  "types",
  "zoom",
] as const satisfies readonly (keyof (ControlOptions & MapControllerProp))[];

function getEventFnName<T extends EventNames>(name: T): EventHandlerFnName<T> {
  return ("on" +
    name[0].toUpperCase() +
    name.slice(1)) as EventHandlerFnName<T>;
}

export type Props = ControlOptions &
  CallbackProperties<DispatcherTypeCC> &
  MapControllerProp;

// defining the type explicitly otherwise compiled .d.ts refers to .svelte which is not good
// type MethodNames = "blur" | "focus" | "setQuery";
// export type Methods = { [T in MethodNames]: GeocodingControl[T] };
export type Methods = {
  /**
   * Blur the search input box.
   */
  blur(): void;

  /**
   * Focus the search input box.
   *
   * @param options [FocusOptions](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus#options)
   */
  focus(options?: FocusOptions): void;

  /**
   * Set the content of search input box.
   *
   * @param value text to set
   * @param submit perform the search
   */
  setQuery(value: string, submit?: boolean): void;

  /**
   * Clear geocoding search results from the map.
   */
  clearMap(): void;

  /**
   * Clear search result list.
   */
  clearList(): void;

  /**
   * Set reverse geocoding mode.
   *
   * @param reverseActive reverse geocoding active
   */
  setReverseMode(reverseActive: boolean): void;
};

const ReactGeocodingControl = forwardRef(function ReactGeocodingControl(
  props: Props,
  ref: Ref<Methods>,
) {
  const divRef = useRef<HTMLDivElement>(undefined);

  const controlRef = useRef<GeocodingControl>(undefined);

  const options = { ...props };

  for (const eventName of eventNames) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete options[getEventFnName(eventName)];
  }

  useEffect(() => {
    if (!divRef.current) {
      throw new Error();
    }

    const control = new GeocodingControl({
      target: divRef.current,
      props: options,
    });

    controlRef.current = control;

    return () => control.$destroy();
  }, []);

  // watch change on every option
  for (const propName of propertyNames) {
    useEffect(() => {
      if (controlRef.current && props[propName] !== undefined) {
        controlRef.current.$set({ [propName]: props[propName] });
      }
    }, [props[propName]]);
  }

  // attach event handlers
  for (const eventName of eventNames) {
    const eventHandlerFn = props[getEventFnName(eventName)];

    useEffect(
      () =>
        eventHandlerFn &&
        controlRef.current?.$on(eventName, (e) => {
          eventHandlerFn(e.detail as never);
        }),

      [eventHandlerFn],
    );
  }

  useImperativeHandle(ref, () => ({
    setQuery: (value: string, submit = true) =>
      controlRef.current?.setQuery(value, submit),
    clearMap: () => controlRef.current?.clearMap(),
    clearList: () => controlRef.current?.clearList(),
    focus: (options?: FocusOptions) => controlRef.current?.focus(options),
    blur: () => controlRef.current?.blur(),
    setReverseMode: (reverseActive: boolean) =>
      controlRef.current?.$set({ reverseActive }),
  }));

  return createElement("div", { ref: divRef });
});

export { ReactGeocodingControl as GeocodingControl };
