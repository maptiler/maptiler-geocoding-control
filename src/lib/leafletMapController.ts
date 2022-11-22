import * as L from "leaflet";
import MarkerIcon from "./MarkerIcon.svelte";
import type { Feature, MapController, Proximity } from "./types";
import type {
  Polygon,
  MultiPolygon,
  LineString,
  MultiLineString,
} from "@turf/helpers";
import union from "@turf/union";
import { setMask } from "./mask";

export function createLeafletMapController(
  map: L.Map,
  marker: boolean | L.MarkerOptions = true,
  showResultMarkers: boolean | L.MarkerOptions = true,
  flyToOptions: L.ZoomPanOptions = {},
  flyToBounds: L.FitBoundsOptions = {},
  fullGeometryStyle: L.PathOptions | L.StyleFunction = (feature) => {
    const type = feature?.geometry?.type;

    const weight = feature?.properties?.isMask
      ? 0
      : type === "LineString" || type === "MultiLineString"
      ? 3
      : 2;

    return {
      color: "#3170fe",
      fillColor: "#000",
      fillOpacity: feature?.properties?.isMask ? 0.1 : 0,
      weight,
      dashArray: [weight, weight],
      lineCap: "butt",
    };
  }
) {
  let proximityChangeHandler: ((proximity: Proximity) => void) | undefined;

  let mapClickHandler: ((coordinates: [number, number]) => void) | undefined;

  let prevProximity: Proximity = undefined;

  let markers: L.Marker[] = [];

  let selectedMarker: L.Marker | undefined;

  let resultLayer = L.geoJSON(undefined, {
    style: fullGeometryStyle,
  }).addTo(map);

  const handleMoveEnd = () => {
    if (!proximityChangeHandler) {
      prevProximity = undefined;

      return;
    }

    let c: L.LatLng;

    const proximity =
      map.getZoom() > 10
        ? ([(c = map.getCenter().wrap()).lng, c.lat] as [number, number])
        : undefined;

    if (prevProximity !== proximity) {
      prevProximity = proximity;

      proximityChangeHandler(proximity);
    }
  };

  const handleMapClick = (e: L.LeafletMouseEvent) => {
    mapClickHandler?.([e.latlng.lng, e.latlng.lat]);
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

    flyTo(center: [number, number], zoom: number) {
      map.flyTo(center, zoom, { duration: 2, ...flyToOptions });
    },

    fitBounds(bbox: [number, number, number, number], padding: number): void {
      map.flyToBounds(
        [
          [bbox[1], bbox[0]],
          [bbox[3], bbox[2]],
        ],
        { padding: [padding, padding], duration: 2, ...flyToBounds }
      );
    },

    indicateReverse(reverse: boolean): void {
      map.getContainer().style.cursor = reverse ? "crosshair" : "";
    },

    setMarkers(
      markedFeatures: Feature[] | undefined,
      picked: Feature | undefined
    ): void {
      function setData(data?: GeoJSON.GeoJSON) {
        resultLayer.clearLayers();

        if (data) {
          resultLayer.addData(data);
        }
      }

      for (const marker of markers) {
        marker.remove();
      }

      markers.length = 0;

      setData();

      const createMarker = (pos: L.LatLngExpression) => {
        const element = document.createElement("div");

        new MarkerIcon({ props: { displayIn: "leaflet" }, target: element });

        return new L.Marker(pos, {
          icon: new L.DivIcon({ html: element, className: "" }),
        });
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
          setData(picked as any);

          return; // no pin for (multi)linestrings
        }

        const pos: L.LatLngExpression = [picked.center[1], picked.center[0]];

        markers.push(
          (typeof marker === "object"
            ? new L.Marker(pos, marker)
            : createMarker(pos)
          ).addTo(map)
        );
      }

      for (const feature of markedFeatures ?? []) {
        if (feature === picked) {
          continue;
        }

        const pos: L.LatLngExpression = [feature.center[1], feature.center[0]];

        markers.push(
          (typeof showResultMarkers === "object"
            ? new L.Marker(pos, showResultMarkers)
            : createMarker(pos)
          ).addTo(map)
        );
      }
    },

    setSelectedMarker(index: number): void {
      if (selectedMarker) {
        selectedMarker.getElement()?.classList.toggle("marker-selected", false);
      }

      selectedMarker = index > -1 ? markers[index] : undefined;

      selectedMarker?.getElement()?.classList.toggle("marker-selected", true);
    },
  };

  return ctrl;
}
