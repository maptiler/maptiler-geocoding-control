import { feature, featureCollection } from "@turf/helpers";
import union from "@turf/union";
import type { GeoJSON, LineString, MultiLineString, MultiPolygon, Polygon } from "geojson";
import maplibregl from "maplibre-gl";

import type { BBox, Feature, Position } from "../types";
import { unwrapBbox } from "../utils/geo-utils";
import { getMask } from "../utils/mask";

import "../geocoder/geocoder";
import type { MaptilerGeocoderElement } from "../geocoder/geocoder";
import type {
  FeaturesListedEvent,
  MaptilerGeocoderEventName,
  MaptilerGeocoderEventNameMap,
  PickEvent,
  QueryChangeEvent,
  RequestEvent,
  ResponseEvent,
  ReverseToggleEvent,
  SelectEvent,
} from "../geocoder/geocoder-events";

import "../components/marker";

import type { MaplibreglGeocodingControlEventName, MaplibreglGeocodingControlEventNameMap } from "./maplibregl-events";
import { DEFAULT_GEOMETRY_STYLE, type MaplibreglGeocodingControlOptions, RESULT_LAYER_FILL, RESULT_LAYER_LINE, RESULT_SOURCE, ZOOM_DEFAULTS } from "./maplibregl-options";

const Evented = maplibregl.Evented;
const Marker = maplibregl.Marker;
const Popup = maplibregl.Popup;
type Evented = maplibregl.Evented;
type GeoJSONSource = maplibregl.GeoJSONSource;
type IControl = maplibregl.IControl;
type MapMouseEvent = maplibregl.MapMouseEvent;
type Marker = maplibregl.Marker;
type MarkerOptions = maplibregl.MarkerOptions;
type MLMap = maplibregl.Map;
type MLEvent = Extract<Parameters<Evented["fire"]>[0], object>;

export class MaplibreglGeocodingControl extends Evented implements IControl {
  #options: MaplibreglGeocodingControlOptions;
  #map?: MLMap;
  #element?: MaptilerGeocoderElement;

  constructor(options: MaplibreglGeocodingControlOptions = {}) {
    super();
    this.#options = options;
  }

  onAdd(map: MLMap): HTMLElement {
    /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
    // Check if Maptiler SDK is present
    if ("getSdkConfig" in map && typeof map.getSdkConfig === "function") {
      const { primaryLanguage, apiKey } = map.getSdkConfig();

      if (this.#options.apiKey === undefined) {
        this.#options.apiKey = apiKey;
      }

      if (this.#options.language === undefined) {
        const match = primaryLanguage.code?.match(/^([a-z]{2,3})($|_|-)/);
        if (match) {
          this.#options.language = match[1];
        }
      }
    }
    /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

    this.#map = map;
    this.#element = map._container.ownerDocument.createElement("maptiler-geocoder");
    this.#setElementOptions();
    this.#addEventListeners();

    const div = document.createElement("div");
    div.className = "mapboxgl-ctrl-geocoder mapboxgl-ctrl maplibregl-ctrl-geocoder maplibregl-ctrl mapboxgl-ctrl-group";
    div.appendChild(this.#element as Node);
    return div;
  }

  onRemove(): void {
    this.#removeEventListeners();
    this.#map = undefined;
    this.#element = undefined;
  }

  /**
   * Update the control options.
   *
   * @param options options to update
   */
  setOptions(options: MaplibreglGeocodingControlOptions) {
    Object.assign(this.#options, options);
    this.#setElementOptions();
  }

  /**
   * Set the content of search input box.
   *
   * @param value text to set
   */
  setQuery(value: string) {
    this.#element?.setQuery(value);
  }

  /**
   * Set the content of search input box and immediately submit it.
   *
   * @param value text to set and submit
   */
  submitQuery(value: string) {
    this.#element?.submitQuery(value);
  }

  /**
   * Clear geocoding search results from the map.
   */
  clearMap() {
    this.#markedFeatures = [];
    this.#setFeatures(undefined, undefined);
  }

  /**
   * Clear search result list.
   */
  clearList() {
    this.#element?.clearList();
  }

  /**
   * Set reverse geocoding mode.
   *
   * @param reverseActive reverse geocoding active
   */
  setReverseMode(reverseActive: boolean) {
    this.setOptions({ reverseActive });
  }

  /**
   * Focus the search input box.
   *
   * @param options [FocusOptions](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus#options)
   */
  focus(options?: FocusOptions) {
    this.#element?.focus(options);
  }

  /**
   * Blur the search input box.
   */
  blur() {
    this.#element?.blur();
  }

  #markers = new Map<Feature, Marker>();
  #selectedMarker: Marker | undefined;
  #reverseMarker: Marker | undefined;
  #markedFeatures?: Feature[];
  #savedData: GeoJSON | undefined; // used to restore features on style switch
  #prevIdToFly?: string; // was not state nor prop before

  #elementEventListeners: { [EventName in MaptilerGeocoderEventName]: (e: MaptilerGeocoderEventNameMap[EventName]) => void } = {
    reversetoggle: (event: ReverseToggleEvent) => {
      const canvasContainer = this.#map?.getCanvasContainer();
      if (canvasContainer) {
        canvasContainer.style.cursor = event.detail.reverse ? "crosshair" : "";
      }
      this.#dispatch("reversetoggle", event.detail);
    },
    querychange: (event: QueryChangeEvent) => {
      const coords = (event as QueryChangeEvent).detail.reverseCoords;

      this.#setReverseMarker(coords ? [coords.decimalLongitude, coords.decimalLatitude] : undefined);
      this.#dispatch("querychange", event.detail);
    },
    queryclear: () => {
      this.#setReverseMarker(undefined);
      this.#dispatch("queryclear");
    },
    request: (event: RequestEvent) => {
      this.#dispatch("request", event.detail);
    },
    response: (event: ResponseEvent) => {
      this.#dispatch("response", event.detail);
    },
    select: (event: SelectEvent) => {
      const selected = (event as SelectEvent).detail.feature;
      if (selected && this.#flyToEnabled && this.#options.flyToSelected) {
        this.#flyTo(selected.center, this.#computeZoom(selected));
      }
      if (this.#markedFeatures && selected) {
        this.#setSelectedMarker(selected);
      }
      this.#dispatch("select", event.detail);
    },
    pick: (event: PickEvent) => {
      const picked = (event as PickEvent).detail.feature;
      if (picked && picked.id !== this.#prevIdToFly && this.#flyToEnabled) {
        this.#goToPicked(picked);
        this.#setFeatures(this.#markedFeatures, picked);
      }

      this.#prevIdToFly = picked?.id;

      this.#dispatch("pick", event.detail);
    },
    featuresshow: () => {
      this.#dispatch("featuresshow");
    },
    featureshide: () => {
      this.#dispatch("featureshide");
    },
    featureslisted: (event: FeaturesListedEvent) => {
      const features = (event as FeaturesListedEvent).detail.features;
      this.#markedFeatures = features;
      this.#setFeatures(this.#markedFeatures, undefined);
      this.#zoomToResults(features);
      this.#dispatch("featureslisted", event.detail);
    },
    featuresclear: () => {
      this.#markedFeatures = undefined;
      this.#setFeatures(undefined, undefined);
      this.#dispatch("featuresclear");
    },
    focusin: () => {
      this.#dispatch("focusin");
    },
    focusout: () => {
      this.#dispatch("focusout");
    },
  };
  #mapEventListeners = {
    render: () => {
      const zoom = this.#map?.getZoom();
      const center = this.#map?.getCenter();
      this.#element?.handleMapChange(zoom && center ? [zoom, center.lng, center.lat] : undefined);
    },
    click: (e: MapMouseEvent) => {
      this.#element?.handleMapClick([e.lngLat.lng, e.lngLat.lat]);
    },
    styledata: () => {
      setTimeout(() => {
        if (this.#savedData) {
          this.#syncFullGeometryLayer();
        }
      });
    },
  };

  #setElementOptions() {
    if (!this.#element) return;

    this.#element.setOptions(this.#options);
    this.#element.fetchFullGeometryOnPick = this.#options.pickedResultStyle !== "marker-only";
  }

  #addEventListeners() {
    if (!this.#element || !this.#map) return;

    for (const [type, listener] of Object.entries(this.#elementEventListeners)) {
      this.#element.addEventListener(type as MaptilerGeocoderEventName, listener as EventListener);
    }

    for (const [type, listener] of Object.entries(this.#mapEventListeners)) {
      this.#map.on(type, listener);
    }
  }

  #removeEventListeners() {
    if (!this.#element || !this.#map) return;

    for (const [type, listener] of Object.entries(this.#elementEventListeners)) {
      this.#element.removeEventListener(type as MaptilerGeocoderEventName, listener as EventListener);
    }

    for (const [type, listener] of Object.entries(this.#mapEventListeners)) {
      this.#map.off(type, listener);
    }
  }

  #dispatch<E extends MaplibreglGeocodingControlEventName>(type: E, detail?: MaplibreglGeocodingControlEventNameMap[E]): this {
    return super.fire({ type, ...(detail ?? {}) } as MLEvent);
  }

  #goToPicked(picked: Feature) {
    if (picked.bbox[0] === picked.bbox[2] && picked.bbox[1] === picked.bbox[3]) {
      this.#flyTo(picked.center, this.#computeZoom(picked));
    } else {
      this.#fitBounds(unwrapBbox(picked.bbox), 50, this.#computeZoom(picked));
    }
  }

  #zoomToResults(features: Feature[] | undefined) {
    if (!features || features.length === 0 || !this.#flyToEnabled) return;

    const fuzzyOnly = features.every((feature) => feature.matching_text);
    const bbox = features.reduce<BBox>(
      (bbox, feature) =>
        fuzzyOnly || !feature.matching_text
          ? [Math.min(bbox[0], feature.bbox[0]), Math.min(bbox[1], feature.bbox[1]), Math.max(bbox[2], feature.bbox[2]), Math.max(bbox[3], feature.bbox[3])]
          : bbox,
      [180, 90, -180, -90],
    );

    const allZoom = features
      .map((feature) => this.#computeZoom(feature))
      .filter((zoom) => zoom !== undefined)
      .reduce<number | undefined>((allZoom, featZoom) => (allZoom === undefined ? featZoom : Math.max(allZoom, featZoom)), undefined);

    this.#fitBounds(unwrapBbox(bbox), 50, allZoom);
  }

  #computeZoom(feature: Feature): number | undefined {
    if (feature.bbox[0] !== feature.bbox[2] || feature.bbox[1] !== feature.bbox[3]) {
      return undefined;
    }

    const index = feature.id.replace(/\..*/, "");
    const zoomMap = this.#options.zoom ?? ZOOM_DEFAULTS;

    return (
      (Array.isArray(feature.properties?.categories)
        ? (feature.properties.categories as string[]).reduce<number | undefined>((a, category) => {
            const b = zoomMap[index + "." + category] as number | undefined;

            return a === undefined ? b : b === undefined ? a : Math.max(a, b);
          }, undefined)
        : undefined) ?? zoomMap[index]
    );
  }

  get #flyToEnabled() {
    return Boolean(this.#options.flyTo) || this.#options.flyTo === undefined;
  }
  get #flyToOptions() {
    return typeof this.#options.flyTo === "boolean" ? {} : this.#options.flyTo;
  }
  get #fitBoundsOptions() {
    return typeof this.#options.flyTo === "boolean" ? {} : this.#options.flyTo;
  }

  #flyTo(center: Position, zoom?: number): void {
    this.#map?.flyTo({ center, ...(zoom ? { zoom } : {}), ...this.#flyToOptions });
  }

  #fitBounds(bbox: BBox, padding: number, maxZoom?: number): void {
    this.#map?.fitBounds(
      [
        [bbox[0], bbox[1]],
        [bbox[2], bbox[3]],
      ],
      { padding, ...(maxZoom ? { maxZoom } : {}), ...this.#fitBoundsOptions },
    );
  }

  #setReverseMarker(coordinates?: Position) {
    if (this.#options.marker === false || this.#options.marker === null || !this.#map) {
      return;
    }

    if (this.#reverseMarker) {
      if (!coordinates) {
        this.#reverseMarker.remove();

        this.#reverseMarker = undefined;
      } else {
        this.#reverseMarker.setLngLat(coordinates);
      }
    } else if (coordinates) {
      if (this.#options.marker instanceof Function) {
        this.#reverseMarker = this.#options.marker(this.#map) ?? undefined;
      } else {
        this.#reverseMarker = this.#createMarker(this.#options.marker).setLngLat(coordinates).addTo(this.#map);
        this.#reverseMarker.getElement().classList.add("marker-reverse");
      }
    }
  }

  #setFeatures(markedFeatures: Feature[] | undefined, picked: Feature | undefined): void {
    if (!this.#map) {
      return;
    }

    for (const marker of this.#markers.values()) {
      marker.remove();
    }

    this.#markers = new Map();

    this.#setAndSaveData(undefined);

    const addMarker = () => {
      if (!picked || !this.#map || this.#options.marker === false || this.#options.marker === null) return;

      const marker =
        this.#options.marker instanceof Function ? this.#options.marker(this.#map, picked) : this.#createMarker(this.#options.marker).setLngLat(picked.center).addTo(this.#map);
      if (marker) {
        this.#markers.set(picked, marker);
      }
    };

    if (picked?.geometry.type === "GeometryCollection") {
      const polygonGeometries = picked.geometry.geometries.filter(
        (geometry): geometry is Polygon | MultiPolygon => geometry.type === "Polygon" || geometry.type === "MultiPolygon",
      );

      if (polygonGeometries.length > 0) {
        const unioned = union(featureCollection(polygonGeometries.map((geom) => feature(geom))));

        if (unioned) {
          const mask = getMask({ ...picked, geometry: unioned.geometry });
          if (mask) {
            this.#setAndSaveData(mask);
          }
        }
      } else {
        const lineGeometries = picked.geometry.geometries.filter(
          (geometry): geometry is LineString | MultiLineString => geometry.type === "LineString" || geometry.type === "MultiLineString",
        );

        if (lineGeometries.length > 0) {
          this.#setAndSaveData({
            ...picked,
            geometry: { type: "GeometryCollection", geometries: lineGeometries },
          });
        }
      }
    } else if (picked?.geometry.type.endsWith("Polygon")) {
      const mask = getMask(picked as Feature<Polygon | MultiPolygon>);
      if (mask) {
        this.#setAndSaveData(mask);
      }
      if (this.#options.pickedResultStyle === "full-geometry-including-polygon-center-marker") {
        addMarker();
      }
    } else if (picked?.geometry.type.endsWith("LineString")) {
      this.#setAndSaveData(picked);
    } else if (picked?.geometry.type.endsWith("Point")) {
      addMarker();
    }

    if (this.#options.showResultMarkers !== false && this.#options.showResultMarkers !== null) {
      for (const feature of markedFeatures ?? []) {
        if (feature.id === picked?.id) {
          continue;
        }

        let marker;

        if (this.#options.showResultMarkers instanceof Function) {
          marker = this.#options.showResultMarkers(this.#map, feature);

          if (!marker) {
            continue;
          }
        } else {
          marker = this.#createMarker(this.#options.showResultMarkers)
            .setLngLat(feature.center)
            .setPopup(
              new Popup({
                offset: [1, -27],
                closeButton: false,
                closeOnMove: true,
                className: "maptiler-gc-popup",
              }).setText(feature.place_type[0] === "reverse" ? feature.place_name : feature.place_name.replace(/,.*/, "")),
            )
            .addTo(this.#map);

          marker.getElement().classList.add("marker-interactive");
        }

        const element = marker.getElement();

        element.addEventListener("click", (e) => {
          e.stopPropagation();
          this.#dispatch("markerclick", { feature, marker });
        });

        element.addEventListener("mouseenter", () => {
          this.#dispatch("markermouseenter", { feature, marker });
          marker.togglePopup();
        });

        element.addEventListener("mouseleave", () => {
          this.#dispatch("markermouseleave", { feature, marker });
          marker.togglePopup();
        });

        // element.classList.toggle("marker-fuzzy", !!feature.matching_text);

        this.#markers.set(feature, marker);
      }
    }
  }

  #setSelectedMarker(feature: Feature): void {
    this.#selectedMarker?.getElement().classList.toggle("marker-selected", false);

    if (this.#options.markerOnSelected) {
      this.#selectedMarker = this.#markers.get(feature);
      this.#selectedMarker?.getElement().classList.toggle("marker-selected", true);
    } else if (this.#selectedMarker) {
      this.#selectedMarker = undefined;
    }
  }

  #syncFullGeometryLayer() {
    if (!this.#map?.loaded) {
      void this.#map?.once("load", () => {
        this.#syncFullGeometryLayer();
      });
      return;
    }

    const effFullGeometryStyle =
      this.#options.fullGeometryStyle === undefined || this.#options.fullGeometryStyle === true
        ? DEFAULT_GEOMETRY_STYLE
        : !this.#options.fullGeometryStyle
          ? undefined
          : this.#options.fullGeometryStyle;
    const source = this.#map.getSource<GeoJSONSource>(RESULT_SOURCE);

    if ((!effFullGeometryStyle?.fill && !effFullGeometryStyle?.line) || (!source && !this.#savedData)) {
      return;
    }

    if (source) {
      source.setData(this.#savedData ?? featureCollection([]));
    } else if (this.#savedData) {
      this.#map.addSource(RESULT_SOURCE, {
        type: "geojson",
        data: this.#savedData,
      });
    }

    if (!this.#map.getLayer(RESULT_LAYER_FILL) && effFullGeometryStyle.fill) {
      this.#map.addLayer({
        ...effFullGeometryStyle.fill,
        id: RESULT_LAYER_FILL,
        type: "fill",
        source: RESULT_SOURCE,
      });
    }

    if (!this.#map.getLayer(RESULT_LAYER_LINE) && effFullGeometryStyle.line) {
      this.#map.addLayer({
        ...effFullGeometryStyle.line,
        id: RESULT_LAYER_LINE,
        type: "line",
        source: RESULT_SOURCE,
      });
    }
  }

  #setAndSaveData(data?: GeoJSON) {
    this.#savedData = data;

    this.#syncFullGeometryLayer();
  }

  #createMarker(options: MarkerOptions | true | undefined) {
    if (typeof options !== "object") {
      options = { element: this.#map?._container.ownerDocument.createElement("maptiler-geocode-marker"), offset: [1, -13] };
    }
    return new Marker(options);
  }
}
