import * as L from "leaflet";
import MarkerIcon from "./MarkerIcon.svelte";
import type { Feature, MapController, MapEvent, Proximity } from "./types";
import type {
  Polygon,
  MultiPolygon,
  LineString,
  MultiLineString,
} from "@turf/helpers";
import union from "@turf/union";
import { setMask } from "./mask";
import type { GeoJSON } from "geojson";

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
  let eventHandler: ((e: MapEvent) => void) | undefined;

  let prevProximity: Proximity = undefined;

  let markers: L.Marker[] = [];

  let selectedMarker: L.Marker | undefined;

  let reverseMarker: L.Marker | undefined;

  let resultLayer = L.geoJSON(undefined, {
    style: fullGeometryStyle,
    interactive: false,
  }).addTo(map);

  const handleMoveEnd = () => {
    let c: L.LatLng;

    const proximity =
      map.getZoom() > 10
        ? ([(c = map.getCenter().wrap()).lng, c.lat] as [number, number])
        : undefined;

    if (prevProximity !== proximity) {
      prevProximity = proximity;

      eventHandler?.({ type: "proximityChange", proximity });
    }
  };

  const handleMapClick = (e: L.LeafletMouseEvent) => {
    eventHandler?.({
      type: "mapClick",
      coordinates: [e.latlng.lng, e.latlng.lat],
    });
  };

  function createMarker(pos: L.LatLngExpression, interactive = false) {
    const element = document.createElement("div");

    new MarkerIcon({ props: { displayIn: "leaflet" }, target: element });

    return new L.Marker(pos, {
      interactive,
      icon: new L.DivIcon({
        html: element,
        className: "",
        iconAnchor: [12, 26],
        iconSize: [25, 30],
        tooltipAnchor: [1, -24],
      }),
    });
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

    flyTo(center: [number, number], zoom: number) {
      map.flyTo([center[1], center[0]], zoom, { duration: 2, ...flyToOptions });
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

    setReverseMarker(coordinates: [number, number]) {
      if (!marker) {
        return;
      }

      const latLng =
        coordinates && ([coordinates[1], coordinates[0]] as [number, number]);

      if (reverseMarker) {
        if (!latLng) {
          reverseMarker.remove();

          reverseMarker = undefined;
        } else {
          reverseMarker.setLatLng(latLng);
        }
      } else if (latLng) {
        reverseMarker = (
          typeof marker === "object"
            ? new L.Marker(latLng, marker)
            : createMarker(latLng)
        ).addTo(map);

        reverseMarker.getElement()?.classList.add("marker-reverse");
      }
    },

    setMarkers(
      markedFeatures: Feature[] | undefined,
      picked: Feature | undefined
    ): void {
      if (!marker) {
        return;
      }

      function setData(data?: GeoJSON) {
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

      if (showResultMarkers) {
        for (const feature of markedFeatures ?? []) {
          if (feature === picked) {
            continue;
          }

          const pos: L.LatLngExpression = [
            feature.center[1],
            feature.center[0],
          ];

          const marker =
            typeof showResultMarkers === "object"
              ? new L.Marker(pos, showResultMarkers)
              : createMarker(pos, true);

          marker.addTo(map).bindTooltip(feature.place_name.replace(/,.*/, ""), {
            direction: "top",
          });

          const element = marker.getElement();

          if (element) {
            element.addEventListener("click", (e) => {
              e.stopPropagation();

              eventHandler?.({ type: "markerClick", id: feature.id });
            });

            element.addEventListener("mouseenter", () => {
              eventHandler?.({ type: "markerMouseEnter", id: feature.id });
            });

            element.addEventListener("mouseleave", () => {
              eventHandler?.({ type: "markerMouseLeave", id: feature.id });
            });

            element.classList.toggle("marker-fuzzy", !!feature.matching_text);
          }

          markers.push(marker);
        }
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
