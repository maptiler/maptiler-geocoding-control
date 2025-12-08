import type { convert } from "geo-coordinates-parser";
import type { Feature, FeatureCollection } from "../types";

export type ReverseToggleEvent = CustomEvent<{ reverse: boolean }>;
export type QueryChangeEvent = CustomEvent<{ query: string; reverseCoords: ReturnType<typeof convert> | false }>;
export type QueryClearEvent = CustomEvent<void>;
export type RequestEvent = CustomEvent<{ urlObj: URL }>;
export type ResponseEvent = CustomEvent<{ url: string; featureCollection: FeatureCollection }>;
export type SelectEvent = CustomEvent<{ feature: Feature | undefined }>;
export type PickEvent = CustomEvent<{ feature: Feature | undefined }>;
export type FeaturesShowEvent = CustomEvent<void>;
export type FeaturesHideEvent = CustomEvent<void>;
export type FeaturesListedEvent = CustomEvent<{ features: Feature[] | undefined }>;
export type FeaturesClearEvent = CustomEvent<void>;

export type MaptilerGeocoderEventNameMap = {
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

  focusin: FocusEvent;
  focusout: FocusEvent;
};

export type MaptilerGeocoderEvent = MaptilerGeocoderEventNameMap[keyof MaptilerGeocoderEventNameMap];
export type MaptilerGeocoderEventName = keyof MaptilerGeocoderEventNameMap;
