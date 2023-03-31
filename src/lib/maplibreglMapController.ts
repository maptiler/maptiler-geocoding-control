import type {
  LineString,
  MultiLineString,
  MultiPolygon,
  Polygon,
} from "@turf/helpers";
import union from "@turf/union";
import type { FeatureCollection, GeoJSON } from "geojson";
import type * as maplibregl from "maplibre-gl";
import type {
  FillLayerSpecification,
  FitBoundsOptions,
  FlyToOptions,
  GeoJSONSource,
  LineLayerSpecification,
  LngLat,
  Map,
  MapMouseEvent,
  Marker,
} from "maplibre-gl";
import MarkerIcon from "./MarkerIcon.svelte";
import { setMask } from "./mask";
import type { Feature, MapController, MapEvent, Proximity } from "./types.js";

type MapLibreGL = Pick<typeof maplibregl, "Marker" | "Popup">;

let emptyGeojson: FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

export function createMapLibreGlMapController(
  map: Map,
  maplibregl?: MapLibreGL | undefined,
  marker: boolean | maplibregl.MarkerOptions = true,
  showResultMarkers: boolean | maplibregl.MarkerOptions = true,
  flyToOptions: FlyToOptions = {},
  fitBoundsOptions: FitBoundsOptions = {},
  fullGeometryStyle:
    | undefined
    | {
        fill?: Pick<FillLayerSpecification, "layout" | "paint" | "filter">;
        line?: Pick<LineLayerSpecification, "layout" | "paint" | "filter">;
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
  let eventHandler: ((e: MapEvent) => void) | undefined;

  let prevProximity: Proximity = undefined;

  let markers: Marker[] = [];

  let selectedMarker: maplibregl.Marker | undefined;

  let reverseMarker: maplibregl.Marker | undefined;

  function addFullGeometryLayer() {
    if (fullGeometryStyle?.fill || fullGeometryStyle?.line) {
      map.addSource("full-geom", {
        type: "geojson",
        data: emptyGeojson,
      });
    }

    if (fullGeometryStyle?.fill) {
      map.addLayer({
        ...fullGeometryStyle?.fill,
        id: "full-geom-fill",
        type: "fill",
        source: "full-geom",
      });
    }

    if (fullGeometryStyle?.line) {
      map.addLayer({
        ...fullGeometryStyle?.line,
        id: "full-geom-line",
        type: "line",
        source: "full-geom",
      });
    }
  }

  if (map.loaded()) {
    addFullGeometryLayer();
  } else {
    map.once("load", () => {
      addFullGeometryLayer();
    });
  }

  const handleMapClick = (e: MapMouseEvent) => {
    eventHandler?.({
      type: "mapClick",
      coordinates: [e.lngLat.lng, e.lngLat.lat],
    });
  };

  const handleMoveEnd = () => {
    let c: LngLat;

    const proximity =
      map.getZoom() > 9
        ? ([(c = map.getCenter().wrap()).lng, c.lat] as [number, number])
        : undefined;

    if (prevProximity !== proximity) {
      prevProximity = proximity;

      eventHandler?.({ type: "proximityChange", proximity });
    }
  };

  function createMarker(interactive = false) {
    if (!maplibregl) {
      throw new Error();
    }

    const element = document.createElement("div");

    if (interactive) {
      element.classList.add("marker-interactive");
    }

    new MarkerIcon({
      props: { displayIn: "maplibre" },
      target: element,
    });

    return new maplibregl.Marker({ element, offset: [1, -13] });
  }

  const ctrl: MapController = {
    setEventHandler(handler: undefined | ((e: MapEvent) => void)): void {
      if (handler) {
        eventHandler = handler;

        map.on("moveend", handleMoveEnd);

        handleMoveEnd();

        map.on("click", handleMapClick);
      } else {
        map.off("moveend", handleMoveEnd);

        eventHandler?.({ type: "proximityChange", proximity: undefined });

        eventHandler = undefined;

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
      map.getCanvasContainer().style.cursor = reverse ? "crosshair" : "";
    },

    setReverseMarker(coordinates: [number, number]) {
      if (!maplibregl || !marker) {
        return;
      }

      if (reverseMarker) {
        if (!coordinates) {
          reverseMarker.remove();

          reverseMarker = undefined;
        } else {
          reverseMarker.setLngLat(coordinates);
        }
      } else if (coordinates) {
        reverseMarker = (
          typeof marker === "object"
            ? new maplibregl.Marker(marker)
            : createMarker()
        )
          .setLngLat(coordinates)
          .addTo(map);

        reverseMarker.getElement().classList.add("marker-reverse");
      }
    },

    setMarkers(
      markedFeatures: Feature[] | undefined,
      picked: Feature | undefined
    ): void {
      if (!marker) {
        return;
      }

      function setData(data: GeoJSON) {
        (map.getSource("full-geom") as GeoJSONSource)?.setData(data);
      }

      for (const marker of markers) {
        marker.remove();
      }

      markers.length = 0;

      setData(emptyGeojson);

      if (!maplibregl) {
        return;
      }

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

            setMask({ ...picked, geometry }, setData);

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
          setMask(picked as any, setData);
        } else if (
          picked.geometry.type === "LineString" ||
          picked.geometry.type === "MultiLineString"
        ) {
          setData(picked);

          return; // no pin for (multi)linestrings
        }

        if (marker) {
          markers.push(
            (typeof marker === "object"
              ? new maplibregl.Marker(marker)
              : createMarker()
            )
              .setLngLat(picked.center)
              .addTo(map)
          );
        }
      }

      if (showResultMarkers) {
        for (const feature of markedFeatures ?? []) {
          if (feature === picked) {
            continue;
          }

          const marker = (
            typeof showResultMarkers === "object"
              ? new maplibregl.Marker(showResultMarkers)
              : createMarker(true)
          )
            .setLngLat(feature.center)
            .setPopup(
              new maplibregl.Popup({
                offset: [1, -27],
                closeButton: false,
                closeOnMove: true,
                className: "maptiler-gc-popup",
              }).setText(feature.place_name.replace(/,.*/, ""))
            )
            .addTo(map);

          const element = marker.getElement();

          element.addEventListener("click", (e) => {
            e.stopPropagation();

            eventHandler?.({ type: "markerClick", id: feature.id });
          });

          element.addEventListener("mouseenter", () => {
            eventHandler?.({ type: "markerMouseEnter", id: feature.id });

            marker.togglePopup();
          });

          element.addEventListener("mouseleave", () => {
            eventHandler?.({ type: "markerMouseLeave", id: feature.id });

            marker.togglePopup();
          });

          element.classList.toggle("marker-fuzzy", !!feature.matching_text);

          markers.push(marker);
        }
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
