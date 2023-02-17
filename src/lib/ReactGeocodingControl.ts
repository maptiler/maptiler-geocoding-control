import GeocodingControl from "./GeocodingControl.svelte";
import {
  createElement,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type Ref,
} from "react";
import type { ControlOptions, Feature, MapController } from "./types";

// TODO this would be nice to be derived from `Parameters<GeocodingControl["$on"]>[0]` but it just doesn't work
type CallbackProperties = {
  onSelect?: (feature: Feature | undefined) => void;
  onPick?: (feature: Feature | undefined) => void;
  onOptionsVisibilityChange?: (visible: boolean) => void;
  onFeaturesListed?: (visible: Feature[] | undefined) => void;
  onFeaturesMarked?: (visible: Feature[] | undefined) => void;
  onResponse?: (onResponse: { url: string; response: Response }) => void;
  onReversetoggle?: (reverse: boolean) => void;
  onQuerychange?: (query: string) => void;
};

type EventName<T extends keyof CallbackProperties> = T extends `on${infer U}`
  ? Uncapitalize<U>
  : never;

type EventNames = EventName<keyof CallbackProperties>;

const eventNames = [
  "featuresListed",
  "featuresMarked",
  "optionsVisibilityChange",
  "pick",
  "querychange",
  "response",
  "reversetoggle",
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
  "trackProximity",
  "types",
  "zoom",
  "mapController",
] as const satisfies readonly (keyof (ControlOptions & MapControllerProp))[];

type EventHandlerFnName<T extends EventNames> = `on${Capitalize<T>}`;

function getEventFnName<T extends EventNames>(name: T): EventHandlerFnName<T> {
  return ("on" +
    name[0].toUpperCase() +
    name.slice(1)) as EventHandlerFnName<T>;
}

export type Props = ControlOptions & CallbackProperties & MapControllerProp;

// // not used because it does not integrate well with Svelte
// type MethodNames = "blur" | "focus" | "setQuery";
//
// export type Methods = { [T in MethodNames]: GeocodingControl[T] };

export type Methods = {
  blur: () => void;
  focus: () => void;
  setQuery: (value: string, submit?: boolean) => void;
};

const ReactGeocodingControl = forwardRef(function ReactGeocodingControl(
  props: Props,
  ref: Ref<Methods>
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

    useEffect(() => {
      controlRef.current?.$on(
        eventName,
        !eventHandlerFn
          ? undefined
          : (e) => {
              (eventHandlerFn as any)(e.detail);
            }
      );
    }, [eventHandlerFn]);
  }

  useImperativeHandle(ref, () => ({
    setQuery: (value: string, submit = true) =>
      controlRef.current?.setQuery(value, submit),
    focus: () => controlRef.current?.focus(),
    blur: () => controlRef.current?.blur(),
  }));

  return createElement("div", { ref: divRef });
});

export { ReactGeocodingControl as GeocodingControl };
