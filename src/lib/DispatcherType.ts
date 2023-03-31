import type { Feature, FeatureCollection } from "./types";

export type DispatcherType = {
  featuresListed: Feature[];
  featuresMarked: Feature[];
  optionsVisibilityChange: boolean;
  pick: Feature;
  queryChange: string;
  response: { url: string; featureCollection: FeatureCollection };
  reverseToggle: boolean;
  select: Feature;
};
