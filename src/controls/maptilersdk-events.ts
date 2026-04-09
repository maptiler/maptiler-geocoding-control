import type { Marker, Map as SDKMap } from "@maptiler/sdk";
import type { MaptilerGeocoderEvent } from "../geocoder/geocoder-events";
import type { Feature } from "../types";
import type { MaptilerGeocodingControl } from "./maptilersdk-control";

type SDKEvent = Extract<Parameters<SDKMap["fire"]>[0], object>;

type BaseEvent = SDKEvent & { target: MaptilerGeocodingControl };

export namespace MaptilerGeocodingControlEvent {
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

export type ReverseToggleEvent = MaptilerGeocodingControlEvent.ReverseToggleEvent;
export type QueryChangeEvent = MaptilerGeocodingControlEvent.QueryChangeEvent;
export type QueryClearEvent = MaptilerGeocodingControlEvent.QueryClearEvent;
export type RequestEvent = MaptilerGeocodingControlEvent.RequestEvent;
export type ResponseEvent = MaptilerGeocodingControlEvent.ResponseEvent;
export type SelectEvent = MaptilerGeocodingControlEvent.SelectEvent;
export type PickEvent = MaptilerGeocodingControlEvent.PickEvent;
export type FeaturesShowEvent = MaptilerGeocodingControlEvent.FeaturesShowEvent;
export type FeaturesHideEvent = MaptilerGeocodingControlEvent.FeaturesHideEvent;
export type FeaturesListedEvent = MaptilerGeocodingControlEvent.FeaturesListedEvent;
export type FeaturesClearEvent = MaptilerGeocodingControlEvent.FeaturesClearEvent;
export type FocusInEvent = MaptilerGeocodingControlEvent.FocusInEvent;
export type FocusOutEvent = MaptilerGeocodingControlEvent.FocusOutEvent;
export type MarkerClickEvent = MaptilerGeocodingControlEvent.MarkerClickEvent;
export type MarkerMouseEnterEvent = MaptilerGeocodingControlEvent.MarkerMouseEnterEvent;
export type MarkerMouseLeaveEvent = MaptilerGeocodingControlEvent.MarkerMouseLeaveEvent;

export type MaptilerGeocodingControlEventNameMap = {
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

export type MaptilerGeocodingControlEvent = MaptilerGeocodingControlEventNameMap[keyof MaptilerGeocodingControlEventNameMap];
export type MaptilerGeocodingControlEventName = keyof MaptilerGeocodingControlEventNameMap;
