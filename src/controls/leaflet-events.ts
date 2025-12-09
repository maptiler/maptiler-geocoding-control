import type { Marker } from "leaflet";
import type { Feature } from "../types";

import type * as Geocoder from "../geocoder/geocoder-events";

export type ReverseToggleEvent = Geocoder.ReverseToggleEvent["detail"];
export type QueryChangeEvent = Geocoder.QueryChangeEvent["detail"];
export type FeaturesListedEvent = Geocoder.FeaturesListedEvent["detail"];
export type RequestEvent = Geocoder.RequestEvent["detail"];
export type ResponseEvent = Geocoder.ResponseEvent["detail"];
export type SelectEvent = Geocoder.SelectEvent["detail"];
export type PickEvent = Geocoder.PickEvent["detail"];
export type MarkerClickEvent = { feature: Feature; marker: Marker };
export type MarkerMouseEnterEvent = { feature: Feature; marker: Marker };
export type MarkerMouseLeaveEvent = { feature: Feature; marker: Marker };
export type LeafletGeocodingControlEventNameMap = {
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

export type LeafletGeocodingControlEvent = LeafletGeocodingControlEventNameMap[keyof LeafletGeocodingControlEventNameMap];
export type LeafletGeocodingControlEventName = keyof LeafletGeocodingControlEventNameMap;
