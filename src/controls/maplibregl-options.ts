import maplibregl from "maplibre-gl";

type FillLayerSpecification = maplibregl.FillLayerSpecification;
type FitBoundsOptions = maplibregl.FitBoundsOptions;
type FlyToOptions = maplibregl.FlyToOptions;
type LineLayerSpecification = maplibregl.LineLayerSpecification;
type Marker = maplibregl.Marker;
type MarkerOptions = maplibregl.MarkerOptions;
type MLMap = maplibregl.Map;

import type { MaptilerGeocoderOptions } from "../geocoder/geocoder-options";
import type { Feature, FlyToFeatures, PickedResultStyle } from "../types";

export type MaplibreglGeocodingControlOptions = Omit<MaptilerGeocoderOptions, "apiKey" | "fetchFullGeometryOnPick"> & {
  /**
   * Maptiler API key. Optional if used with MapTiler SDK - if not specified, the control will use the same API key as the map uses.
   */
  apiKey?: string;

  /**
   * Marker to be added to the map at the location of the user-selected result using a default set of Marker options.
   *
   * - If `true` or `undefined` then a default marker will be used.
   * - If the value is a [MarkerOptions](https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MarkerOptions/) then the marker will be constructed using these options.
   * - If the value is a function then it can return instance of the [Marker](https://maplibre.org/maplibre-gl-js/docs/API/classes/Marker/).
   *   Function can accept `Feature` as a parameter which is `undefined` for the reverse location marker.
   * - If `false` or `null` then no marker will be added to the map.
   *
   * Default value is `true`.
   */
  marker?: null | boolean | MarkerOptions | ((map: MLMap, feature?: Feature) => undefined | null | Marker);

  /**
   * Displays a marker on the selected feature from the result list. `marker` must be enabled in any way for this to display.
   *
   * Default: `true`.
   */
  markerOnSelected?: boolean;

  /**
   * Marker be added to the map at the location the geocoding results.
   *
   * - If `true` or `undefined` then a default marker will be used.
   * - If the value is a [MarkerOptions](https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MarkerOptions/) then the marker will be constructed using these options.
   * - If the value is a function then it can return instance of the [Marker](https://maplibre.org/maplibre-gl-js/docs/API/classes/Marker/).
   *   In this case the default pop-up won't be added to the marker.
   *   Function can accept `Feature` as a parameter.
   * - If `false` or `null` then no marker will be added to the map.
   *
   * Default value is `true`.
   */
  showResultMarkers?: null | boolean | MarkerOptions | ((map: MLMap, feature: Feature) => undefined | null | Marker);

  /**
   * Animation to picked feature on the map.
   *
   * - If `false` or `null` then animating the map to a selected result is disabled.
   * - If `true` or `undefined` then animating the map will use the default animation parameters.
   * - If an [FlyToOptions](https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/FlyToOptions/)
   *     ` & `[FitBoundsOptions](https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/FitBoundsOptions/)
   *     then it will be passed as options to the map [flyTo](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/#flyto)
   *     or [fitBounds](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/#fitbounds) method providing control over the animation of the transition.
   *
   * Default value is `true`.
   */
  flyTo?: null | boolean | (FlyToOptions & FitBoundsOptions);

  /**
   * Specifies if found features (shown in result list) should be also animated to on the map. `flyTo` muset be enabled in any way for this to have any effect.
   *
   * - If `false` or `"never"` then animating the map to found features is disabled.
   * - If `true` or `"always"` then animating the map to found features is enabled.
   * - If `"external"` then animating the map to found features is enabled only when explicitly calling `setQuery` or `submitQuery` methods.
   *
   * Default: `"external"`.
   */
  flyToFeatures?: boolean | FlyToFeatures;

  /**
   * Specifies if selected (not picked) feature should be also animated to on the map. `flyTo` muset be enabled in any way for this to have any effect.
   *
   * Default: `false`.
   */
  flyToSelected?: boolean;

  /**
   * Style for full feature geometry GeoJSON.
   *
   * - If `false` or `null` then no full geometry is drawn.
   * - If `true` or `undefined` then default-styled full geometry is drawn.
   * - If an T then it must represent the style and will be used to style the full geometry.
   *
   * Default is the default style.
   */
  fullGeometryStyle?: null | boolean | Partial<FullGeometryStyle>;

  /**
   * Style of the picked result on the map:
   * - `"marker-only"`: Show only a marker at the center of the feature.
   * - `"full-geometry"`: Display the full feature geometry.
   * - `"full-geometry-including-polygon-center-marker"`: Display full geometry with a marker at the polygon center.
   *
   * Default: `"full-geometry"`.
   */
  pickedResultStyle?: PickedResultStyle;

  /**
   * Specifies the zoom level to animate the map to for a geocoded result when no bounding box is present or when the result is a point.
   * If a bounding box is present and not a point, the map will fit to the bounding box.
   *
   * Values are key-value pairs where the key is a `<type>` or `<type>.<category>` and the value is the zoom level.
   *
   * Default: `ZOOM_DEFAULTS`.
   */
  zoom?: Record<string, number>;
};

export type FullGeometryStyle = {
  fill: Pick<FillLayerSpecification, "layout" | "paint" | "filter">;
  line: Pick<LineLayerSpecification, "layout" | "paint" | "filter">;
};

export const ZOOM_DEFAULTS: Record<string, number> = {
  continental_marine: 4,
  country: 4,
  major_landform: 8,
  region: 5,
  subregion: 6,
  county: 7,
  joint_municipality: 8,
  joint_submunicipality: 9,
  municipality: 10,
  municipal_district: 11,
  locality: 12,
  neighbourhood: 13,
  place: 14,
  postal_code: 14,
  road: 16,
  poi: 17,
  address: 18,
  "poi.peak": 15,
  "poi.shop": 18,
  "poi.cafe": 18,
  "poi.restaurant": 18,
  "poi.aerodrome": 13,
  // TODO add many more
};

export const DEFAULT_GEOMETRY_STYLE: FullGeometryStyle = {
  fill: {
    paint: {
      "fill-color": "#000",
      "fill-opacity": 0.1,
    },
    filter: ["all", ["==", ["geometry-type"], "Polygon"], ["has", "isMask"]],
  },
  line: {
    layout: {
      "line-cap": "square",
    },
    paint: {
      "line-width": ["case", ["==", ["geometry-type"], "Polygon"], 2, 3],
      "line-dasharray": [1, 1],
      "line-color": "#3170fe",
    },
    filter: ["!", ["has", "isMask"]],
  },
};

export const RESULT_SOURCE = "mtlr-gc-full-geom";
export const RESULT_LAYER_FILL = "mtlr-gc-full-geom-fill";
export const RESULT_LAYER_LINE = "mtlr-gc-full-geom-line";
