export type Feature = {
  id: string;
  text: string;
  place_name: string;
  place_type: string;
  center: [number, number];
  bbox: [number, number, number, number];
};

export type FeatureCollection = {
  features: Feature[];
};
