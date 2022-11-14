import type MapLibreGL from "maplibre-gl";
import type {
  FitBoundsOptions,
  MapMouseEvent,
  LngLat,
  Map,
  Marker,
  FlyToOptions,
  GeoJSONSource,
  FillLayerSpecification,
  LineLayerSpecification,
} from "maplibre-gl";
import MarkerIcon from "./MarkerIcon.svelte";
import type { Feature, MapController, Proximity } from "./types";
import union from "@turf/union";
import buffer from "@turf/buffer";
import difference from "@turf/difference";
import type {
  Polygon,
  MultiPolygon,
  LineString,
  MultiLineString,
  Feature as TurfFeature,
  Position,
} from "@turf/helpers";

let emptyGeojson: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

export function createMaplibreglMapController(
  map: Map,
  maplibregl?: typeof MapLibreGL | undefined,
  marker: boolean | maplibregl.MarkerOptions = true,
  showResultMarkers: boolean | maplibregl.MarkerOptions = true,
  flyToOptions: FlyToOptions = {},
  fitBoundsOptions: FitBoundsOptions = {},
  fullGeometryStyle: {
    fill: Pick<FillLayerSpecification, "layout" | "paint" | "filter">;
    line: Pick<LineLayerSpecification, "layout" | "paint" | "filter">;
  } = {
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
  }
) {
  let proximityChangeHandler: ((proximity: Proximity) => void) | undefined;

  let mapClickHandler: ((coordinates: [number, number]) => void) | undefined;

  let prevProximity: Proximity = undefined;

  let markers: Marker[] = [];

  let selectedMarker: maplibregl.Marker | undefined;

  function addFullGeometryLayer() {
    map.addSource("full-geom", {
      type: "geojson",
      data: emptyGeojson,
    });

    map.addLayer({
      ...fullGeometryStyle.fill,
      id: "full-geom-fill",
      type: "fill",
      source: "full-geom",
    });

    map.addLayer({
      ...fullGeometryStyle.line,
      id: "full-geom-line",
      type: "line",
      source: "full-geom",
    });
  }

  if (map.loaded()) {
    addFullGeometryLayer();
  } else {
    map.once("load", () => {
      addFullGeometryLayer();
    });
  }

  const handleMapClick = (e: MapMouseEvent) => {
    mapClickHandler?.([e.lngLat.lng, e.lngLat.lat]);
  };

  const handleMoveEnd = () => {
    let c: LngLat;

    const proximity =
      map.getZoom() > 9
        ? ([(c = map.getCenter().wrap()).lng, c.lat] as [number, number])
        : undefined;

    if (prevProximity !== proximity) {
      prevProximity = proximity;

      proximityChangeHandler?.(proximity);
    }
  };

  const ctrl: MapController = {
    setProximityChangeHandler(
      _proximityChangeHandler: ((proximity: Proximity) => void) | undefined
    ): void {
      if (_proximityChangeHandler) {
        proximityChangeHandler = _proximityChangeHandler;

        map.on("moveend", handleMoveEnd);

        handleMoveEnd();
      } else {
        map.off("moveend", handleMoveEnd);

        proximityChangeHandler?.(undefined);

        proximityChangeHandler = undefined;
      }
    },

    setMapClickHandler(
      _mapClickHandler: ((coordinates: [number, number]) => void) | undefined
    ): void {
      mapClickHandler = _mapClickHandler;

      if (mapClickHandler) {
        map.on("click", handleMapClick);
      } else {
        map.off("click", handleMapClick);
      }
    },

    flyTo(center: [number, number], zoom: number): void {
      map.flyTo({ center, zoom, ...flyToOptions });
    },

    fitBounds(bbox: [number, number, number, number], padding: number): void {
      map.fitBounds(
        [
          [bbox[0], bbox[1]],
          [bbox[2], bbox[3]],
        ],
        { padding, ...fitBoundsOptions }
      );
    },

    indicateReverse(reverse: boolean): void {
      map.getCanvas().style.cursor = reverse ? "crosshair" : "";
    },

    setMarkers(
      markedFeatures: Feature[] | undefined,
      picked: Feature | undefined
    ): void {
      function setData(data: GeoJSON.GeoJSON) {
        (map.getSource("full-geom") as GeoJSONSource)?.setData(data);
      }

      // see https://maplibre.org/maplibre-gl-js-docs/example/line-across-180th-meridian/
      function fixRing(ring: Position[]) {
        let prev: Position | undefined = undefined;

        for (const c of ring) {
          if (prev && c[0] - prev[0] >= 180) {
            c[0] -= 360;
          } else if (prev && c[0] - prev[0] < -180) {
            c[0] += 360;
          }

          prev = c;
        }
      }

      function setMask(picked: TurfFeature<Polygon | MultiPolygon>) {
        const diff = difference(
          {
            type: "Polygon",
            coordinates: [
              [
                [180, 90],
                [-180, 90],
                [-180, -90],
                [180, -90],
                [180, 90],
              ],
            ],
          },
          picked
        );

        if (!diff) {
          return;
        }

        diff.properties = { isMask: "y" };

        const fixed = buffer(picked, 0);

        if (fixed.geometry.type === "Polygon") {
          for (const ring of fixed.geometry.coordinates) {
            fixRing(ring);
          }
        } else {
          for (const poly of fixed.geometry.coordinates) {
            for (const ring of poly) {
              fixRing(ring);
            }
          }
        }

        setData({
          type: "FeatureCollection",
          features: [fixed, diff],
        });
      }

      for (const marker of markers) {
        marker.remove();
      }

      markers.length = 0;

      setData(emptyGeojson);

      if (!maplibregl) {
        return;
      }

      const createMarker = () => {
        const element = document.createElement("div");

        new MarkerIcon({
          props: { displayIn: "maplibre" },
          target: element,
        });

        return new maplibregl.Marker({ element });
      };

      if (picked) {
        let handled = false;

        if (picked.geometry.type === "GeometryCollection") {
          const geoms = picked.geometry.geometries.filter(
            (geometry) =>
              geometry.type === "Polygon" || geometry.type === "MultiPolygon"
          ) as (Polygon | MultiPolygon)[];

          if (geoms.length > 0) {
            let geometry = geoms.pop()!;

            for (const geom of geoms) {
              geometry = union(geometry, geom) as unknown as
                | Polygon
                | MultiPolygon; // union actually returns geometry
            }

            setMask({ ...picked, geometry });

            handled = true;
          } else {
            const geometries = picked.geometry.geometries.filter(
              (geometry) =>
                geometry.type === "LineString" ||
                geometry.type === "MultiLineString"
            ) as (LineString | MultiLineString)[];

            if (geometries.length > 0) {
              setData({
                ...picked,
                geometry: { type: "GeometryCollection", geometries },
              });

              handled = true;
            }
          }
        }

        if (handled) {
          // nothing
        } else if (
          picked.geometry.type === "Polygon" ||
          picked.geometry.type === "MultiPolygon"
        ) {
          setMask(picked as any);
        } else if (
          picked.geometry.type === "LineString" ||
          picked.geometry.type === "MultiLineString"
        ) {
          setData(picked as any);

          return; // no pin for (multi)linestrings
        }

        markers.push(
          (typeof marker === "object"
            ? new maplibregl.Marker(marker)
            : createMarker()
          )
            .setLngLat(picked.center)
            .addTo(map)
        );
      }

      for (const feature of markedFeatures ?? []) {
        if (feature === picked) {
          continue;
        }

        markers.push(
          (typeof showResultMarkers === "object"
            ? new maplibregl.Marker(showResultMarkers)
            : createMarker()
          )
            .setLngLat(feature.center)
            .addTo(map)
        );
      }
    },

    setSelectedMarker(index: number): void {
      if (selectedMarker) {
        selectedMarker.getElement().classList.toggle("marker-selected", false);
      }

      selectedMarker = index > -1 ? markers[index] : undefined;

      selectedMarker?.getElement().classList.toggle("marker-selected", true);
    },
  };

  return ctrl;
}
