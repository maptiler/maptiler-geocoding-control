import type { Feature as FeatureType, Geometry } from "geojson";

export type BBox = [minx: number, miny: number, maxx: number, maxy: number];

export type Position = [x: number, y: number];

export type Feature<T extends Geometry = Geometry> = FeatureType<T> & {
  id: string;
  text: string;
  place_name: string;
  place_type: string[];
  place_type_name: string[];
  center: Position;
  bbox: BBox;
  address?: string;
  matching_text?: string;
};

export type FeatureCollection<T extends Geometry = Geometry> = {
  type: "FeatureCollection";
  features: Feature<T>[];
};

export type ProximityRule = {
  /** minimal map zoom for the rule to be used */
  minZoom?: number;

  /** maximal map zoom for the rule to be used */
  maxZoom?: number;
} & (
  | {
      /** fixed proximity */
      type: "fixed";

      /** coordinates of the fixed proximity */
      coordinates: Position;
    }
  | {
      /** use map center coordinates for the proximity */
      type: "map-center";
    }
  | {
      /** resolve proximity by geolocating IP of the geocoding API call */
      type: "server-geolocation";
    }
  | ({
      /** use browser's geolocation API for proximity. If it fails, following proximity rules are iterated. */
      type: "client-geolocation";

      /** how long should the geolocation result be cached, in milliseconds */
      cachedLocationExpiry?: number;
    } & PositionOptions)
);

export type PickedResultStyle = "marker-only" | "full-geometry" | "full-geometry-including-polygon-center-marker";

export type EnableReverse = "never" | "always" | "button";

export type ShowPlaceType = "never" | "always" | "if-needed";

export type TypeRule = PlaceType | [minZoom: number | null | undefined, maxZoom: number | null | undefined, type: PlaceType];

export type PlaceType =
  | "continental_marine"
  | "country"
  | "major_landform"
  | "region"
  | "subregion"
  | "county"
  | "joint_municipality"
  | "joint_submunicipality"
  | "municipality"
  | "municipal_district"
  | "locality"
  | "neighbourhood"
  | "place"
  | "postal_code"
  | "address"
  | "road"
  | "poi";
