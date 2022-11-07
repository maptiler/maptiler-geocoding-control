import * as L from "leaflet";
import MarkerIcon from "./MarkerIcon.svelte";
import type { Feature, MapController, Proximity } from "./types";

export function createLeafletMapController(
  map: L.Map,
  marker: boolean | L.MarkerOptions = true,
  showResultMarkers: boolean | L.MarkerOptions = true,
  flyToOptions: L.ZoomPanOptions = {},
  flyToBounds: L.FitBoundsOptions = {}
) {
  let proximityChangeHandler: ((proximity: Proximity) => void) | undefined;

  let mapClickHandler: ((coordinates: [number, number]) => void) | undefined;

  let prevProximity: Proximity = undefined;

  let markers: L.Marker[] = [];

  let selectedMarker: L.Marker | undefined;

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

  map.on("moveend", handleMoveEnd);

  handleMoveEnd();

  map.on("click", (e) => {
    mapClickHandler?.([e.latlng.lng, e.latlng.lat]);
  });

  const ctrl: MapController = {
    setProximityChangeHandler(
      _proximityChangeHandler: ((proximity: Proximity) => void) | undefined
    ): void {
      proximityChangeHandler = _proximityChangeHandler;
    },

    setMapClickHandler(
      _mapClickHandler: ((coordinates: [number, number]) => void) | undefined
    ): void {
      mapClickHandler = _mapClickHandler;
    },

    flyTo(center: [number, number], zoom: number) {
      map.flyTo(center, zoom, flyToOptions);
    },

    fitBounds(bbox: [number, number, number, number], padding: number): void {
      map.flyToBounds(
        [
          [bbox[1], bbox[0]],
          [bbox[3], bbox[2]],
        ],
        { ...flyToBounds, padding: [padding, padding] }
      );
    },

    indicateReverse(reverse: boolean): void {
      // TODO
      // map.getCanvas().style.cursor = reverse ? "crosshair" : "";
    },

    setMarkers(
      markedFeatures: Feature[] | undefined,
      picked: Feature | undefined
    ): void {
      for (const marker of markers) {
        marker.remove();
      }

      markers.length = 0;

      for (const feature of picked
        ? [...(markedFeatures ?? []), picked]
        : markedFeatures ?? []) {
        let m: L.Marker;

        const pos: L.LatLngExpression = [feature.center[1], feature.center[0]];

        if (feature === picked && typeof marker === "object") {
          m = new L.Marker(pos, marker);
        } else if (
          feature !== picked &&
          typeof showResultMarkers === "object"
        ) {
          m = new L.Marker(pos, showResultMarkers);
        } else {
          const element = document.createElement("div");

          new MarkerIcon({ props: { displayIn: "leaflet" }, target: element });

          m = new L.Marker(pos, {
            icon: new L.DivIcon({ html: element, className: "" }),
          });
        }

        markers.push(m.addTo(map));
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
