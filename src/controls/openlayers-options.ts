/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { AnimationOptions, FitOptions } from "ol/View";
import type { Options } from "ol/control/Control";
import Fill from "ol/style/Fill";
import Icon from "ol/style/Icon";
import Stroke from "ol/style/Stroke";
import Style, { type StyleFunction, type StyleLike } from "ol/style/Style";
import Text from "ol/style/Text";
import type { FlatStyleLike } from "ol/style/flat";

import type { MaptilerGeocoderOptions } from "../geocoder/geocoder-options";
import type { PickedResultStyle } from "../types";

export type OpenLayersGeocodingControlOptions = Omit<MaptilerGeocoderOptions, "fetchFullGeometryOnPick"> & {
  /**
   * Marker to be added to the map at the location of the user-selected result.
   *
   * Default value is `true`.
   */
  marker?: boolean;

  /**
   * Displays a marker on the selected feature from the result list. `marker` must be also enabled for this to display.
   *
   * Default: `true`.
   */
  markerOnSelected?: boolean;

  /**
   * Marker be added to the map at the location the geocoding results.
   *
   * Default value is `true`.
   */
  showResultMarkers?: boolean;

  /**
   * Animation to picked feature on the map.
   *
   * - If `false` or `null` then animating the map to a selected result is disabled.
   * - If `true` or `undefined` then animating the map will use the default animation parameters.
   * - If the value is [AnimationOptions](https://openlayers.org/en/latest/apidoc/module-ol_View.html#~AnimationOptions)
   *     and [FitOptions](https://openlayers.org/en/latest/apidoc/module-ol_View.html#~FitOptions)
   *     then it will be passed as options to the map's view [animate](https://openlayers.org/en/latest/apidoc/module-ol_View-View.html#animate)
   *     or [fit](https://openlayers.org/en/latest/apidoc/module-ol_View-View.html#fit) method providing control over the animation of the transition.
   *
   * Default value is `true`.
   */
  flyTo?: null | boolean | (AnimationOptions & FitOptions);

  /**
   * Specifies if selected (not picked) feature should be also animated to on the map.
   *
   * Default: `false`.
   */
  flyToSelected?: boolean;

  /**
   * Style for full feature geometry GeoJSON.
   *
   * - If `false` or `null` then no full geometry is drawn.
   * - If `true` or `undefined` then default-styled full geometry is drawn.
   * - If the value is [StyleLike](https://openlayers.org/en/latest/apidoc/module-ol_style_Style.html#~StyleLike)
   *     or [FlatStyleLike](https://openlayers.org/en/latest/apidoc/module-ol_style_flat.html#~FlatStyleLike)
   *     then it must represent the style and will be used to style the full geometry.
   *
   * Default is the default style.
   */
  fullGeometryStyle?: null | boolean | StyleLike | FlatStyleLike;

  /**
   * Opens the Geocoder result list above the query input instead of below. Used when positioned near the bottom of a map.
   *
   * Default: `false`.
   */
  openListOnTop?: boolean;

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
} & Omit<Options, "element">;

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

export const DEFAULT_GEOMETRY_STYLE =
  (options: OpenLayersGeocodingControlOptions): StyleFunction =>
  (feature) => {
    const iconsBaseUrl = options.iconsBaseUrl ?? `https://cdn.maptiler.com/maptiler-geocoding-control/v${import.meta.env.VITE_LIB_VERSION}/icons/`;
    const properties = feature.getProperties();
    const type = feature.getGeometry()?.getType();
    const weight = properties.isMask ? 0 : type === "LineString" || type === "MultiLineString" ? 3 : 2;

    return new Style({
      stroke: properties.isMask
        ? undefined
        : new Stroke({
            color: "#3170fe",
            lineDash: [weight, weight],
            width: weight,
            lineCap: "butt",
          }),
      fill: properties.isMask
        ? new Fill({
            color: "#00000020",
          })
        : undefined,
      image: new Icon({
        src: `${iconsBaseUrl}marker_${properties.isReverse ? "reverse" : properties.isSelected ? "selected" : "unselected"}.svg`,
        anchor: [0.5, 1],
      }),
      zIndex: properties.isSelected ? 2 : properties.isReverse ? 0 : 1,
      text:
        (properties.isSelected || properties.isMouseOver) && properties.tooltip
          ? new Text({
              backgroundFill: new Fill({ color: "white" }),
              text: properties.tooltip,
              offsetY: -40,
              backgroundStroke: new Stroke({
                color: "white",
                lineJoin: "round",
                width: 3,
              }),
              padding: [2, 0, 0, 2],
            })
          : undefined,
    });
  };
