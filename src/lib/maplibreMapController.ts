import type MapLibreGL from "maplibre-gl";
import type {
  FitBoundsOptions,
  MapMouseEvent,
  LngLat,
  Map,
  Marker,
  FlyToOptions,
} from "maplibre-gl";
import MarkerIcon from "./MarkerIcon.svelte";
import type { Feature, MapController, Proximity } from "./types";

export function createMaplibreMapController(
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
      for (const marker of markers) {
        marker.remove();
      }

      markers.length = 0;

      if (!maplibregl) {
        return;
      }

      for (const feature of picked
        ? [...(markedFeatures ?? []), picked]
        : markedFeatures ?? []) {
        let m: Marker;

        if (feature === picked && typeof marker === "object") {
          m = new maplibregl.Marker(marker);
        } else if (
          feature !== picked &&
          typeof showResultMarkers === "object"
        ) {
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
