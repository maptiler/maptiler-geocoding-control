import type { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { Feature as OlFeature, type MapBrowserEvent } from "ol";
import type { FeatureLike } from "ol/Feature";
import type Map from "ol/Map";
import type { AnimationOptions, FitOptions } from "ol/View";
import {
  GeometryCollection as OlGeometryCollection,
  LineString as OlLineString,
  MultiLineString as OlMultiLineString,
  MultiPolygon as OlMultiPolygon,
  Point as OlPoint,
  Polygon as OlPolygon,
  type Geometry as OlGeometry,
} from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import {
  fromLonLat,
  getUserProjection,
  toLonLat,
  transformExtent,
} from "ol/proj";
import VectorSource from "ol/source/Vector";
import Fill from "ol/style/Fill";
import Icon from "ol/style/Icon";
import Stroke from "ol/style/Stroke";
import Style, { type StyleLike } from "ol/style/Style";
import Text from "ol/style/Text";
import type { FlatStyleLike } from "ol/style/flat";
import { setMask } from "./mask";
import type {
  BBox,
  Feature as FeatureType,
  MapController,
  MapEvent,
  Position,
} from "./types";

const EPSG_4326 = "EPSG:4326";

function defaultStyle(feature: FeatureLike) {
  const properties = feature.getProperties();

  const { isMask } = properties;

  const type = feature.getGeometry()?.getType();

  const weight = isMask
    ? 0
    : type === "LineString" || type === "MultiLineString"
      ? 3
      : 2;

  return new Style({
    stroke: isMask
      ? undefined
      : new Stroke({
          color: "#3170fe",
          lineDash: [weight, weight],
          width: weight,
          lineCap: "butt",
        }),
    fill: isMask
      ? new Fill({
          color: "#00000020",
        })
      : undefined,
    image: new Icon({
      src: `/icons/marker_${
        properties.isReverse
          ? "reverse"
          : properties.isSelected
            ? "selected"
            : "unselected"
      }.svg`,
      anchor: [0.5, 1],
    }),
    zIndex: properties.isSelected ? 2 : properties.isReverse ? 0 : 1,
    text:
      properties.isSelected && properties.tooltip
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
}

export function createOpenLayersMapController(
  map: Map,
  flyToOptions: AnimationOptions = {},
  flyToBounds: FitOptions = {},
  fullGeometryStyle: StyleLike | FlatStyleLike = defaultStyle,
  showPolyMarker = false,
) {
  let prevSelected = -1;

  let prevHovered: string | undefined;

  let eventHandler: ((e: MapEvent) => void) | undefined;

  let reverseMarker: OlFeature | undefined;

  let indicatingReverse = false;

  const vectorLayer = new VectorLayer({
    updateWhileAnimating: true,
  });

  map.addLayer(vectorLayer);

  const source = new VectorSource({});

  vectorLayer.setSource(source);

  vectorLayer.setStyle(fullGeometryStyle);

  map.on("click", (e) => {
    map.forEachFeatureAtPixel(e.pixel, (feature) => {
      const id = feature.getId() as string;

      if (!id) {
        return;
      }

      e.stopPropagation();

      eventHandler?.({ type: "markerClick", id });

      return feature;
    });
  });

  map.on("pointermove", (e) => {
    const featureId = map.forEachFeatureAtPixel(e.pixel, (feature) => {
      return feature.getId() as string | undefined;
    });

    if (prevHovered === featureId) {
      return;
    }

    if (prevHovered) {
      eventHandler?.({
        type: "markerMouseLeave",
        id: prevHovered,
      });
    }

    if (featureId) {
      eventHandler?.({
        type: "markerMouseEnter",
        id: featureId,
      });
    }

    map.getTargetElement().style.cursor = featureId
      ? "pointer"
      : indicatingReverse
        ? "crosshair"
        : "";

    prevHovered = featureId;
  });

  function getProjection() {
    return getUserProjection() ?? map.getView().getProjection();
  }

  function fromWgs84(geometry: OlGeometry) {
    return geometry.transform(EPSG_4326, getProjection());
  }

  const handleMapClick = (e: MapBrowserEvent<PointerEvent>) => {
    eventHandler?.({
      type: "mapClick",
      coordinates: toLonLat(e.coordinate, getProjection()) as [number, number],
    });
  };

  return {
    setEventHandler(handler: undefined | ((e: MapEvent) => void)): void {
      if (handler) {
        eventHandler = handler;
        map.on("click", handleMapClick);
      } else {
        eventHandler = undefined;
        map.un("click", handleMapClick);
      }
    },

    flyTo(center: Position, zoom: number) {
      map.getView().animate({
        center: fromLonLat(center, getProjection()),
        ...(zoom ? { zoom } : {}),
        duration: 2000,
        ...flyToOptions,
      });
    },

    fitBounds(bbox: BBox, padding: number, maxZoom: number): void {
      map.getView().fit(transformExtent(bbox, EPSG_4326, getProjection()), {
        padding: [padding, padding, padding, padding],
        ...(maxZoom ? { maxZoom } : {}),
        duration: 2000,
        ...flyToBounds,
      });
    },

    indicateReverse(reverse: boolean): void {
      indicatingReverse = reverse;

      map.getTargetElement().style.cursor = reverse ? "crosshair" : "";
    },

    setReverseMarker(coordinates?: Position) {
      if (reverseMarker) {
        if (!coordinates) {
          source.removeFeature(reverseMarker);

          reverseMarker.dispose();

          reverseMarker = undefined;
        } else {
          (reverseMarker.getGeometry() as OlPoint).setCoordinates(
            fromLonLat(coordinates, getProjection()),
          );
        }
      } else if (coordinates) {
        reverseMarker = new OlFeature(
          new OlPoint(fromLonLat(coordinates, getProjection())),
        );

        reverseMarker.setProperties({ isReverse: true });

        source.addFeature(reverseMarker);
      }
    },

    setMarkers(
      markedFeatures: FeatureType[] | undefined,
      picked: FeatureType | undefined,
    ): void {
      function setData(data?: FeatureCollection<Polygon | MultiPolygon>) {
        if (!data) {
          return;
        }

        for (const f of data.features) {
          const geom =
            f.geometry.type === "Polygon"
              ? new OlPolygon(f.geometry.coordinates)
              : f.geometry.type === "MultiPolygon"
                ? new OlMultiPolygon(f.geometry.coordinates)
                : null;

          if (!geom) {
            continue;
          }

          source.addFeature(
            new OlFeature({
              isMask: !!f.properties?.isMask,
              geometry: fromWgs84(geom),
            }),
          );
        }
      }

      source.clear();

      if (reverseMarker) {
        source.addFeature(reverseMarker);
      }

      if (picked) {
        let handled = false;

        if (picked.geometry.type === "GeometryCollection") {
          const geoms = picked.geometry.geometries
            .map((geometry) =>
              geometry.type === "Polygon"
                ? new OlPolygon(geometry.coordinates)
                : geometry.type === "MultiPolygon"
                  ? new OlMultiPolygon(geometry.coordinates)
                  : null,
            )
            .filter(<T>(a: T | null): a is T => !!a);

          if (geoms.length > 0) {
            source.addFeature(
              new OlFeature(fromWgs84(new OlGeometryCollection(geoms))),
            );

            handled = true;
          } else {
            for (const geometry of picked.geometry.geometries) {
              if (geometry.type === "LineString") {
                source.addFeature(
                  new OlFeature(
                    fromWgs84(new OlLineString(geometry.coordinates)),
                  ),
                );

                handled = true;
              } else if (geometry.type === "MultiLineString") {
                source.addFeature(
                  new OlFeature(
                    fromWgs84(new OlMultiLineString(geometry.coordinates)),
                  ),
                );
              }

              handled = true;
            }
          }
        }

        if (handled) {
          // nothing
        } else if (picked.geometry.type === "Polygon") {
          setMask(picked as FeatureType<Polygon>, setData);
        } else if (picked.geometry.type === "MultiPolygon") {
          setMask(picked as FeatureType<MultiPolygon>, setData);
        } else if (picked.geometry.type === "LineString") {
          source.addFeature(
            new OlFeature(
              fromWgs84(new OlLineString(picked.geometry.coordinates)),
            ),
          );

          return; // no pin for (multi)linestrings
        } else if (picked.geometry.type === "MultiLineString") {
          source.addFeature(
            new OlFeature(
              fromWgs84(new OlMultiLineString(picked.geometry.coordinates)),
            ),
          );

          return; // no pin for (multi)linestrings
        }

        if (!showPolyMarker && picked.geometry.type !== "Point") {
          return;
        }

        source.addFeature(new OlFeature(fromWgs84(new OlPoint(picked.center))));
      }

      for (const feature of markedFeatures ?? []) {
        if (feature === picked) {
          continue;
        }

        const marker = new OlFeature(
          new OlPoint(fromLonLat(feature.center, getProjection())),
        );

        marker.setId(feature.id);

        marker.setProperties({
          fuzzy: !!feature.matching_text,
          tooltip:
            feature.place_type[0] === "reverse"
              ? feature.place_name
              : feature.place_name.replace(/,.*/, ""),
        });

        source.addFeature(marker);
      }
    },

    setSelectedMarker(index: number): void {
      const features = source.getFeatures();

      const offset = features[0]?.getProperties().isReverse ? 1 : 0;

      if (prevSelected > -1) {
        features[prevSelected + offset]?.setProperties({
          isSelected: false,
        });
      }

      if (index > -1) {
        features[index + offset]?.setProperties({
          isSelected: true,
        });
      }

      prevSelected = index;
    },

    getCenterAndZoom() {
      const view = map.getView();

      const center = view.getCenter();

      const zoom = view.getZoom();

      if (!center || zoom === undefined) {
        return undefined;
      }

      return [zoom, ...(toLonLat(center, getProjection()) as Position)];
    },
  } satisfies MapController;
}
