import type { LeafletEvent, Marker } from "leaflet";

import type { MaptilerGeocoderEvent } from "../geocoder/geocoder-events";
import type { Feature } from "../types";
import type { LeafletGeocodingControl } from "./leaflet-control";

type BaseEvent = Pick<LeafletEvent, "type" | "target"> & { target: LeafletGeocodingControl };

export namespace LeafletGeocodingControlEvent {
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

export type ReverseToggleEvent = LeafletGeocodingControlEvent.ReverseToggleEvent;
export type QueryChangeEvent = LeafletGeocodingControlEvent.QueryChangeEvent;
export type QueryClearEvent = LeafletGeocodingControlEvent.QueryClearEvent;
export type RequestEvent = LeafletGeocodingControlEvent.RequestEvent;
export type ResponseEvent = LeafletGeocodingControlEvent.ResponseEvent;
export type SelectEvent = LeafletGeocodingControlEvent.SelectEvent;
export type PickEvent = LeafletGeocodingControlEvent.PickEvent;
export type FeaturesShowEvent = LeafletGeocodingControlEvent.FeaturesShowEvent;
export type FeaturesHideEvent = LeafletGeocodingControlEvent.FeaturesHideEvent;
export type FeaturesListedEvent = LeafletGeocodingControlEvent.FeaturesListedEvent;
export type FeaturesClearEvent = LeafletGeocodingControlEvent.FeaturesClearEvent;
export type FocusInEvent = LeafletGeocodingControlEvent.FocusInEvent;
export type FocusOutEvent = LeafletGeocodingControlEvent.FocusOutEvent;
export type MarkerClickEvent = LeafletGeocodingControlEvent.MarkerClickEvent;
export type MarkerMouseEnterEvent = LeafletGeocodingControlEvent.MarkerMouseEnterEvent;
export type MarkerMouseLeaveEvent = LeafletGeocodingControlEvent.MarkerMouseLeaveEvent;

export type LeafletGeocodingControlEventNameMap = {
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

export type LeafletGeocodingControlEvent = LeafletGeocodingControlEventNameMap[keyof LeafletGeocodingControlEventNameMap];
export type LeafletGeocodingControlEventName = keyof LeafletGeocodingControlEventNameMap;
