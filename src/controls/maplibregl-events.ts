import maplibregl from "maplibre-gl";
import type { MaptilerGeocoderEvent } from "../geocoder/geocoder-events";
import type { Feature } from "../types";
import type { MaplibreglGeocodingControl } from "./maplibregl-control";

type Marker = maplibregl.Marker;
type MLEvent = Extract<Parameters<maplibregl.Evented["fire"]>[0], object>;

type BaseEvent = MLEvent & { target: MaplibreglGeocodingControl };

export namespace MaplibreglGeocodingControlEvent {
  export type ReverseToggleEvent = BaseEvent & MaptilerGeocoderEvent.ReverseToggleEvent["detail"];
  export type QueryChangeEvent = BaseEvent & MaptilerGeocoderEvent.QueryChangeEvent["detail"];
  export type QueryClearEvent = BaseEvent;
  export type RequestEvent = BaseEvent & MaptilerGeocoderEvent.RequestEvent["detail"];
  export type ResponseEvent = BaseEvent & MaptilerGeocoderEvent.ResponseEvent["detail"];
  export type SelectEvent = BaseEvent & MaptilerGeocoderEvent.SelectEvent["detail"];
  export type PickEvent = BaseEvent & MaptilerGeocoderEvent.PickEvent["detail"];
  export type FeaturesShowEvent = BaseEvent;
  export type FeaturesHideEvent = BaseEvent;
  export type FeaturesListedEvent = BaseEvent & MaptilerGeocoderEvent.FeaturesListedEvent["detail"];
  export type FeaturesClearEvent = BaseEvent;
  export type FocusInEvent = BaseEvent;
  export type FocusOutEvent = BaseEvent;
  export type MarkerClickEvent = BaseEvent & { feature: Feature; marker: Marker };
  export type MarkerMouseEnterEvent = BaseEvent & { feature: Feature; marker: Marker };
  export type MarkerMouseLeaveEvent = BaseEvent & { feature: Feature; marker: Marker };
}

export type ReverseToggleEvent = MaplibreglGeocodingControlEvent.ReverseToggleEvent;
export type QueryChangeEvent = MaplibreglGeocodingControlEvent.QueryChangeEvent;
export type QueryClearEvent = MaplibreglGeocodingControlEvent.QueryClearEvent;
export type RequestEvent = MaplibreglGeocodingControlEvent.RequestEvent;
export type ResponseEvent = MaplibreglGeocodingControlEvent.ResponseEvent;
export type SelectEvent = MaplibreglGeocodingControlEvent.SelectEvent;
export type PickEvent = MaplibreglGeocodingControlEvent.PickEvent;
export type FeaturesShowEvent = MaplibreglGeocodingControlEvent.FeaturesShowEvent;
export type FeaturesHideEvent = MaplibreglGeocodingControlEvent.FeaturesHideEvent;
export type FeaturesListedEvent = MaplibreglGeocodingControlEvent.FeaturesListedEvent;
export type FeaturesClearEvent = MaplibreglGeocodingControlEvent.FeaturesClearEvent;
export type FocusInEvent = MaplibreglGeocodingControlEvent.FocusInEvent;
export type FocusOutEvent = MaplibreglGeocodingControlEvent.FocusOutEvent;
export type MarkerClickEvent = MaplibreglGeocodingControlEvent.MarkerClickEvent;
export type MarkerMouseEnterEvent = MaplibreglGeocodingControlEvent.MarkerMouseEnterEvent;
export type MarkerMouseLeaveEvent = MaplibreglGeocodingControlEvent.MarkerMouseLeaveEvent;

export type MaplibreglGeocodingControlEventNameMap = {
  reversetoggle: ReverseToggleEvent;
  querychange: QueryChangeEvent;
  queryclear: QueryClearEvent;
  request: RequestEvent;
  response: ResponseEvent;
  select: SelectEvent;
  pick: PickEvent;
  featuresshow: FeaturesShowEvent;
  featureshide: FeaturesHideEvent;
  featureslisted: FeaturesListedEvent;
  featuresclear: FeaturesClearEvent;

  focusin: FocusInEvent;
  focusout: FocusOutEvent;

  markerclick: MarkerClickEvent;
  markermouseenter: MarkerMouseEnterEvent;
  markermouseleave: MarkerMouseLeaveEvent;
};

export type MaplibreglGeocodingControlEvent = MaplibreglGeocodingControlEventNameMap[keyof MaplibreglGeocodingControlEventNameMap];
export type MaplibreglGeocodingControlEventName = keyof MaplibreglGeocodingControlEventNameMap;
