import type { Feature as OlFeature } from "ol";
import type OLEvent from "ol/events/Event";
import type { Point as OlPoint } from "ol/geom";

import type { MaptilerGeocoderEvent } from "../geocoder/geocoder-events";
import type { Feature } from "../types";
import type { OpenLayersGeocodingControl } from "./openlayers-control";

type BaseEvent = OLEvent & { target: OpenLayersGeocodingControl };

export namespace OpenLayersGeocodingControlEvent {
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
  export type MarkerClickEvent = BaseEvent & { feature: Feature; marker: OlFeature<OlPoint> };
  export type MarkerMouseEnterEvent = BaseEvent & { feature: Feature; marker: OlFeature<OlPoint> };
  export type MarkerMouseLeaveEvent = BaseEvent & { feature: Feature; marker: OlFeature<OlPoint> };
}

export type ReverseToggleEvent = OpenLayersGeocodingControlEvent.ReverseToggleEvent;
export type QueryChangeEvent = OpenLayersGeocodingControlEvent.QueryChangeEvent;
export type QueryClearEvent = OpenLayersGeocodingControlEvent.QueryClearEvent;
export type RequestEvent = OpenLayersGeocodingControlEvent.RequestEvent;
export type ResponseEvent = OpenLayersGeocodingControlEvent.ResponseEvent;
export type SelectEvent = OpenLayersGeocodingControlEvent.SelectEvent;
export type PickEvent = OpenLayersGeocodingControlEvent.PickEvent;
export type FeaturesShowEvent = OpenLayersGeocodingControlEvent.FeaturesShowEvent;
export type FeaturesHideEvent = OpenLayersGeocodingControlEvent.FeaturesHideEvent;
export type FeaturesListedEvent = OpenLayersGeocodingControlEvent.FeaturesListedEvent;
export type FeaturesClearEvent = OpenLayersGeocodingControlEvent.FeaturesClearEvent;
export type FocusInEvent = OpenLayersGeocodingControlEvent.FocusInEvent;
export type FocusOutEvent = OpenLayersGeocodingControlEvent.FocusOutEvent;
export type MarkerClickEvent = OpenLayersGeocodingControlEvent.MarkerClickEvent;
export type MarkerMouseEnterEvent = OpenLayersGeocodingControlEvent.MarkerMouseEnterEvent;
export type MarkerMouseLeaveEvent = OpenLayersGeocodingControlEvent.MarkerMouseLeaveEvent;

export type OpenLayersGeocodingControlEventNameMap = {
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

export type OpenLayersGeocodingControlEvent = OpenLayersGeocodingControlEventNameMap[keyof OpenLayersGeocodingControlEventNameMap];
export type OpenLayersGeocodingControlEventName = keyof OpenLayersGeocodingControlEventNameMap;
