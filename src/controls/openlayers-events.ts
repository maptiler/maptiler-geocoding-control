import type { Feature as OlFeature } from "ol";
import type { Point as OlPoint } from "ol/geom";

import type * as Geocoder from "../geocoder/geocoder-events";
import type { Feature } from "../types";

export type ReverseToggleEvent = Geocoder.ReverseToggleEvent["detail"];
export type QueryChangeEvent = Geocoder.QueryChangeEvent["detail"];
export type FeaturesListedEvent = Geocoder.FeaturesListedEvent["detail"];
export type RequestEvent = Geocoder.RequestEvent["detail"];
export type ResponseEvent = Geocoder.ResponseEvent["detail"];
export type SelectEvent = Geocoder.SelectEvent["detail"];
export type PickEvent = Geocoder.PickEvent["detail"];
export type MarkerClickEvent = { feature: Feature; marker: OlFeature<OlPoint> };
export type MarkerMouseEnterEvent = { feature: Feature; marker: OlFeature<OlPoint> };
export type MarkerMouseLeaveEvent = { feature: Feature; marker: OlFeature<OlPoint> };
export type OpenLayersGeocodingControlEventNameMap = {
  reversetoggle: ReverseToggleEvent;
  querychange: QueryChangeEvent;
  queryclear: never;
  request: RequestEvent;
  response: ResponseEvent;
  select: SelectEvent;
  pick: PickEvent;
  featuresshow: never;
  featureshide: never;
  featureslisted: FeaturesListedEvent;
  featuresclear: never;

  focusin: never;
  focusout: never;

  markerclick: MarkerClickEvent;
  markermouseenter: MarkerMouseEnterEvent;
  markermouseleave: MarkerMouseLeaveEvent;
};

export type OpenLayersGeocodingControlEvent = OpenLayersGeocodingControlEventNameMap[keyof OpenLayersGeocodingControlEventNameMap];
export type OpenLayersGeocodingControlEventName = keyof OpenLayersGeocodingControlEventNameMap;
