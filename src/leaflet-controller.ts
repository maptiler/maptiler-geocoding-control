import bbox from "@turf/bbox";
import clone from "@turf/clone";
import { feature, featureCollection } from "@turf/helpers";
import union from "@turf/union";
import type {
  FeatureCollection,
  GeoJSON,
  Position as GPosition,
  LineString,
  MultiLineString,
  MultiPolygon,
  Polygon,
} from "geojson";
import * as L from "leaflet";
import { unwrapBbox } from "./geoUtils";
import MarkerIcon from "./MarkerIcon.svelte";
import { setMask } from "./mask";
import type { BBox, Feature, MapController, MapEvent, Position } from "./types";

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
  },
) {
  let eventHandler: ((e: MapEvent) => void) | undefined;

  const markers: L.Marker[] = [];

  let selectedMarker: L.Marker | undefined;

  let reverseMarker: L.Marker | undefined;

  const resultLayer = L.geoJSON(undefined, {
    style: fullGeometryStyle,
    interactive: false,
  }).addTo(map);

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

  return {
    setEventHandler(handler: undefined | ((e: MapEvent) => void)): void {
      if (handler) {
        eventHandler = handler;

        map.on("click", handleMapClick);
      } else {
        eventHandler = undefined;

        map.off("click", handleMapClick);
      }
    },

    flyTo(center: Position, zoom: number) {
      map.flyTo([center[1], center[0]], zoom, { duration: 2, ...flyToOptions });
    },

    fitBounds(bbox: BBox, padding: number, maxZoom: number): void {
      map.flyToBounds(
        [
          [bbox[1], bbox[0]],
          [bbox[3], bbox[2]],
        ],
        { padding: [padding, padding], duration: 2, maxZoom, ...flyToBounds },
      );
    },

    indicateReverse(reverse: boolean): void {
      map.getContainer().style.cursor = reverse ? "crosshair" : "";
    },

    setReverseMarker(coordinates?: Position) {
      if (!marker) {
        return;
      }

      const latLng =
        coordinates && ([coordinates[1], coordinates[0]] as Position);

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
      picked: Feature | undefined,
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
            (geometry): geometry is Polygon | MultiPolygon =>
              geometry.type === "Polygon" || geometry.type === "MultiPolygon",
          );

          ok: if (geoms.length > 0) {
            const unioned = union(
              featureCollection(geoms.map((geom) => feature(geom))),
            );

            if (!unioned) {
              break ok;
            }

            setMask(
              {
                ...picked,
                geometry: unioned.geometry,
              },
              setData,
            );

            handled = true;
          } else {
            const geometries = picked.geometry.geometries.filter(
              (geometry): geometry is LineString | MultiLineString =>
                geometry.type === "LineString" ||
                geometry.type === "MultiLineString",
            );

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
          setMask(picked as Feature<Polygon | MultiPolygon>, (fc) => {
            if (!fc) {
              return;
            }

            // leaflet doesn't repeat features every 360 degrees along longitude
            // so we clone it manually to the direction(s)
            // which could be displayed when auto-zoomed on the feature

            const features = [...fc.features];

            const bb = unwrapBbox(bbox(picked) as BBox);

            const span = bb[2] - bb[0];

            if (bb[0] - span / 4 < -180) {
              features.push(...shiftPolyCollection(fc, -360).features);
            }

            if (bb[2] + span / 4 > 180) {
              features.push(...shiftPolyCollection(fc, 360).features);
            }

            setData(featureCollection(features));
          });
        } else if (
          picked.geometry.type === "LineString" ||
          picked.geometry.type === "MultiLineString"
        ) {
          setData(picked);

          return; // no pin for (multi)linestrings
        }

        const pos: L.LatLngExpression = [picked.center[1], picked.center[0]];

        markers.push(
          (typeof marker === "object"
            ? new L.Marker(pos, marker)
            : createMarker(pos)
          ).addTo(map),
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

          marker
            .addTo(map)
            .bindTooltip(
              feature.place_type[0] === "reverse"
                ? feature.place_name
                : feature.place_name.replace(/,.*/, ""),
              {
                direction: "top",
              },
            );

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

    getCenterAndZoom() {
      const c = map.getCenter();

      return [map.getZoom(), c.lng, c.lat];
    },
  } satisfies MapController;
}

function shiftPolyCollection(
  featureCollection: FeatureCollection<Polygon | MultiPolygon>,
  distance: number,
): FeatureCollection<Polygon | MultiPolygon> {
  const cloned = clone(featureCollection);

  for (const feature of cloned.features) {
    if (feature.geometry.type == "MultiPolygon") {
      for (const poly of feature.geometry.coordinates) {
        shiftPolyCoords(poly, distance);
      }
    } else {
      shiftPolyCoords(feature.geometry.coordinates, distance);
    }
  }

  return cloned;
}

function shiftPolyCoords(coordinates: GPosition[][], distance: number) {
  for (const ring of coordinates) {
    for (const position of ring) {
      position[0] += distance;
    }
  }
}
