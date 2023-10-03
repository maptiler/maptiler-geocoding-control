import {
  createElement,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type Ref,
} from "react";
import GeocodingControl from "./GeocodingControl.svelte";
import type { ControlOptions, DispatcherType, MapController } from "./types";

type EventNames = keyof DispatcherType;

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
  "apiKey",
  "bbox",
  "clearButtonTitle",
  "clearOnBlur",
  "collapsed",
  "country",
  "debounceSearch",
  "enableReverse",
  "reverseActive",
  "errorMessage",
  "filter",
  "fuzzyMatch",
  "language",
  "limit",
  "minLength",
  "noResultsMessage",
  "placeholder",
  "proximity",
  "reverseButtonTitle",
  "showFullGeometry",
  "showPlaceType",
  "showResultsWhileTyping",
  "adjustUrlQuery",
  "types",
  "zoom",
  "mapController",
] as const satisfies readonly (keyof (ControlOptions & MapControllerProp))[];

function getEventFnName<T extends EventNames>(name: T): EventHandlerFnName<T> {
  return ("on" +
    name[0].toUpperCase() +
    name.slice(1)) as EventHandlerFnName<T>;
}

export type Props = ControlOptions &
  CallbackProperties<DispatcherType> &
  MapControllerProp;

// defining the type explicitly otherwise compiled .d.ts refers to .svelte which is not good
// type MethodNames = "blur" | "focus" | "setQuery";
// export type Methods = { [T in MethodNames]: GeocodingControl[T] };
export type Methods = {
  blur(): void;
  focus(): void;
  setQuery(value: string, submit?: boolean): void;
  clearMap(): void;
  clearList(): void;
};

const ReactGeocodingControl = forwardRef(function ReactGeocodingControl(
  props: Props,
  ref: Ref<Methods>,
) {
  const divRef = useRef<HTMLDivElement>();

  const controlRef = useRef<GeocodingControl>();

  const options = { ...props };

  for (const eventName of eventNames) {
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
          (eventHandlerFn as any)(e.detail);
        }),

      [eventHandlerFn],
    );
  }

  useImperativeHandle(ref, () => ({
    setQuery: (value: string, submit = true) =>
      controlRef.current?.setQuery(value, submit),
    clearMap: () => controlRef.current?.clearMap(),
    clearList: () => controlRef.current?.clearList(),
    focus: () => controlRef.current?.focus(),
    blur: () => controlRef.current?.blur(),
  }));

  return createElement("div", { ref: divRef });
});

export { ReactGeocodingControl as GeocodingControl };
