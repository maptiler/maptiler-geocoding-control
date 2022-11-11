import type MapLibreGL from "maplibre-gl";
import type {
  FitBoundsOptions,
  MapMouseEvent,
  LngLat,
  Map,
  Marker,
  FlyToOptions,
  GeoJSONSource,
} from "maplibre-gl";
import MarkerIcon from "./MarkerIcon.svelte";
import type { Feature, MapController, Proximity } from "./types";
import mask from "@turf/mask";
import union from "@turf/union";
import type {
  Polygon,
  MultiPolygon,
  LineString,
  MultiLineString,
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
  fitBoundsOptions: FitBoundsOptions = {}
) {
  let proximityChangeHandler: ((proximity: Proximity) => void) | undefined;

  let mapClickHandler: ((coordinates: [number, number]) => void) | undefined;

  let prevProximity: Proximity = undefined;

  let markers: Marker[] = [];

  let selectedMarker: maplibregl.Marker | undefined;

  function addPreviewLayer() {
    map.addSource("preview", {
      type: "geojson",
      data: emptyGeojson,
    });

    map.addLayer({
      id: "preview-fill",
      type: "fill",
      source: "preview",
      layout: {},
      paint: {
        "fill-color": "#000",
        "fill-opacity": 0.1,
      },
      filter: ["==", ["geometry-type"], "Polygon"],
    });

    map.addLayer({
      id: "preview-line",
      type: "line",
      source: "preview",
      layout: {
        "line-cap": "square",
      },
      paint: {
        "line-width": ["case", ["==", ["geometry-type"], "Polygon"], 2, 3],
        "line-dasharray": [1, 1],
        "line-color": "#3170fe",
      },
    });
  }

  if (map.loaded()) {
    addPreviewLayer();
  } else {
    map.once("load", () => {
      addPreviewLayer();
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
        { ...fitBoundsOptions, padding }
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
        (map.getSource("preview") as GeoJSONSource)?.setData(data);
      }

      for (const marker of markers) {
        marker.remove();
      }

      setData(emptyGeojson);

      markers.length = 0;

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

            setData(mask({ ...picked, geometry }));

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

        let m: Marker | undefined = undefined;

        if (handled) {
          // nothing
        } else if (
          picked.geometry.type === "Polygon" ||
          picked.geometry.type === "MultiPolygon"
        ) {
          setData(mask(picked as any));
        } else if (
          picked.geometry.type === "LineString" ||
          picked.geometry.type === "MultiLineString"
        ) {
          setData(picked as any);

          return;
        }

        if (typeof marker === "object") {
          m = new maplibregl.Marker(marker);
        } else {
          const element = document.createElement("div");

          new MarkerIcon({
            props: { displayIn: "maplibre" },
            target: element,
          });

          m = new maplibregl.Marker({ element });
        }

        if (m) {
          markers.push(m.setLngLat(picked.center).addTo(map));
        }
      }

      for (const feature of markedFeatures ?? []) {
        if (feature === picked) {
          continue;
        }

        let m: Marker;

        if (typeof showResultMarkers === "object") {
          m = new maplibregl.Marker(showResultMarkers);
        } else {
          const element = document.createElement("div");

          new MarkerIcon({ props: { displayIn: "maplibre" }, target: element });

          m = new maplibregl.Marker({ element });
        }

        markers.push(m.setLngLat(feature.center).addTo(map));
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
