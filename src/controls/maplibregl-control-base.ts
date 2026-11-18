import { feature, featureCollection } from "@turf/helpers";
import union from "@turf/union";
import type { GeoJSON, LineString, MultiLineString, MultiPolygon, Polygon } from "geojson";
import type { Evented, GeoJSONSource, IControl, MapEventType, MapMouseEvent, Map as MLMap, PopupOptions } from "maplibre-gl";

import type { BBox, Feature, Position } from "../types.js";
import { unwrapBbox } from "../utils/geo-utils.js";
import { getMask } from "../utils/mask.js";

import type { MaptilerGeocoderEvent, MaptilerGeocoderEventName, MaptilerGeocoderEventNameMap } from "../geocoder/geocoder-events.js";
import "../geocoder/geocoder.js";
import type { MaptilerGeocoderElement } from "../geocoder/geocoder.js";
import type { GeocodingControlBase } from "./base-control.js";

import "../components/marker.js";

import type { MaplibreglGeocodingControlEventName, MaplibreglGeocodingControlEventNameMap } from "./maplibregl-events.js";
import { DEFAULT_GEOMETRY_STYLE, type MaplibreglGeocodingControlOptions, RESULT_LAYER_FILL, RESULT_LAYER_LINE, RESULT_SOURCE, ZOOM_DEFAULTS } from "./maplibregl-options.js";

/** Part of the `Marker` API of MapLibre GL JS / MapTiler SDK used by the control */
export type MarkerLike = {
  setLngLat(lngLat: Position): unknown;
  getElement(): HTMLElement;
  togglePopup(): unknown;
  remove(): unknown;
};

/** Options of the control's default marker */
export type DefaultMarkerOptions = { element: HTMLElement; offset: [number, number] };

/** Marker options with the types of the map library */
type MarkerOptionsOf<MapType, MarkerType, MarkerOptionsType> = {
  marker?: null | boolean | MarkerOptionsType | ((map: MapType, feature?: Feature) => undefined | null | MarkerType);
  showResultMarkers?: null | boolean | MarkerOptionsType | ((map: MapType, feature: Feature) => undefined | null | MarkerType);
};

/**
 * Implementation of the control shared by MapLibre GL JS and MapTiler SDK. It doesn't use any classes of the map libraries directly:
 * the subclass creates the markers and popups, and copies the methods of the map library's `Evented` (see `mixinEvented()` in `utils/mixin-evented.ts`).
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export abstract class MaplibreglGeocodingControlBase<
  Options extends Omit<MaplibreglGeocodingControlOptions, "marker" | "showResultMarkers"> & MarkerOptionsOf<MapType, MarkerType, MarkerOptionsType>,
  EventNameMap extends Record<MaplibreglGeocodingControlEventName, { readonly type: string }>,
  MapType extends MLMap,
  MarkerType extends MarkerLike,
  MarkerOptionsType extends object,
>
  implements IControl, GeocodingControlBase<Options>
{
  #options = {} as Options;
  #map?: MapType;
  #element?: MaptilerGeocoderElement;
  #container?: HTMLDivElement;

  constructor(options: Options) {
    // don't call overridable methods like `setOptions` here, fields of subclasses aren't initialized yet
    this.#options = { ...options };
  }

  /** Creates a marker using the `Marker` of the map library */
  protected abstract createMarker(options: MarkerOptionsType | DefaultMarkerOptions): MarkerType;

  /** Adds the marker to the map */
  protected abstract addMarker(map: MapType, marker: MarkerType): void;

  /** Sets a popup with the text to the marker, using the `Popup` of the map library */
  protected abstract setMarkerPopup(marker: MarkerType, options: PopupOptions, text: string): void;

  /** Adjusts the URL of each geocoding request, after the `adjustUrl` option */
  protected adjustRequestUrl?(url: URL): void;

  /** @internal Not to be called directly */
  onAdd(map: MapType): HTMLElement {
    this.#map = map;
    this.#element = map._container.ownerDocument.createElement("maptiler-geocoder");
    this.#element.classList.add("maplibregl-geocoder");

    this.#setElementOptions();
    this.#addEventListeners();

    this.#container = map._container.ownerDocument.createElement("div");
    this.#container.classList.add("maplibregl-ctrl-geocoder", "maplibregl-ctrl", "maplibregl-ctrl-group");
    this.#container.style.position = "relative";
    this.#container.style.zIndex = "3";
    this.#container.appendChild(this.#element as HTMLElement);
    setTimeout(() => this.#element?.setOptions({ openListOnTop: this.#container?.matches(".maplibregl-ctrl-bottom-left *, .maplibregl-ctrl-bottom-right *") }));
    return this.#container;
  }

  /** @internal Not to be called directly */
  onRemove(): void {
    this.#removeEventListeners();
    this.#element?.remove();
    this.#container?.remove();

    this.#map = undefined;
    this.#element = undefined;
    this.#container = undefined;
  }

  getOptions(): Options {
    return { ...this.#options };
  }

  setOptions(options: Options) {
    Object.assign(this.#options, options);
    this.#setElementOptions();
  }

  setQuery(value: string) {
    this.#element?.setQuery(value);
  }

  submitQuery(value: string) {
    this.#element?.submitQuery(value);
  }

  clearMap() {
    this.#markedFeatures = [];
    this.#setFeatures(undefined, undefined);
  }

  clearList() {
    this.#element?.clearList();
  }

  setReverseMode(reverseActive: boolean) {
    this.setOptions({ reverseActive } as Options);
  }

  focus(options?: FocusOptions) {
    this.#element?.focus(options);
  }

  blur() {
    this.#element?.blur();
  }

  /** Markers currently displayed on the map */
  #markers = new Map<Feature, MarkerType>();
  /** Marker representing the selected feature */
  #selectedMarker: MarkerType | undefined;
  /** Marker representing the picked feature */
  #reverseMarker: MarkerType | undefined;
  /** Features currently marked on the map */
  #markedFeatures?: Feature[];
  /** Used to restore features on style switch */
  #savedData: GeoJSON | undefined;
  /** Remember last feature that the map flew to as to not do it again */
  #prevIdToFly?: string;

  #elementEventListeners: { [EventName in MaptilerGeocoderEventName]: (e: MaptilerGeocoderEventNameMap[EventName]) => void } = {
    reversetoggle: (event: MaptilerGeocoderEvent.ReverseToggleEvent) => {
      const canvasContainer = this.#map?.getCanvasContainer();
      if (canvasContainer) {
        canvasContainer.style.cursor = event.detail.reverse ? "crosshair" : "";
      }
      this.#dispatch("reversetoggle", event.detail);
    },
    querychange: (event: MaptilerGeocoderEvent.QueryChangeEvent) => {
      const coords = event.detail.reverseCoords;

      this.#setReverseMarker(coords ? [coords.decimalLongitude, coords.decimalLatitude] : undefined);
      this.#dispatch("querychange", event.detail);
    },
    queryclear: () => {
      this.#setReverseMarker(undefined);
      this.#dispatch("queryclear");
    },
    request: (event: MaptilerGeocoderEvent.RequestEvent) => {
      this.#dispatch("request", event.detail);
    },
    response: (event: MaptilerGeocoderEvent.ResponseEvent) => {
      this.#dispatch("response", event.detail);
    },
    select: (event: MaptilerGeocoderEvent.SelectEvent) => {
      const selected = event.detail.feature;
      if (selected && this.#flyToEnabled && this.#options.flyToSelected) {
        this.#flyTo(selected.center, this.#computeZoom(selected));
      }
      if (this.#markedFeatures && selected) {
        this.#setSelectedMarker(selected);
      }
      this.#dispatch("select", event.detail);
    },
    pick: (event: MaptilerGeocoderEvent.PickEvent) => {
      const picked = event.detail.feature;
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
    featureslisted: (event: MaptilerGeocoderEvent.FeaturesListedEvent) => {
      const features = event.detail.features;
      this.#markedFeatures = features;
      this.#setFeatures(this.#markedFeatures, undefined);
      this.#zoomToResults(event);
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
  #mapEventListeners: { [EventName in keyof MapEventType]?: (e: MapEventType[EventName]) => void } = {
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

    this.#element.setOptions({
      ...this.#options,
      adjustUrl: (url: URL) => {
        this.#options.adjustUrl?.(url);
        this.adjustRequestUrl?.(url);
      },
    });
    this.#element.fetchFullGeometryOnPick = this.#options.pickedResultStyle !== "marker-only";
  }

  #addEventListeners() {
    if (!this.#element || !this.#map) return;

    for (const [type, listener] of Object.entries(this.#elementEventListeners)) {
      this.#element.addEventListener(type as MaptilerGeocoderEventName, listener as EventListener);
    }

    for (const [type, listener] of Object.entries(this.#mapEventListeners)) {
      this.#map.on(type as keyof MapEventType, listener as (ev: MapEventType[keyof MapEventType]) => void);
    }
  }

  #removeEventListeners() {
    if (!this.#element || !this.#map) return;

    for (const [type, listener] of Object.entries(this.#elementEventListeners)) {
      this.#element.removeEventListener(type as MaptilerGeocoderEventName, listener as EventListener);
    }

    for (const [type, listener] of Object.entries(this.#mapEventListeners)) {
      this.#map.off(type as keyof MapEventType, listener as (ev: MapEventType[keyof MapEventType]) => void);
    }
  }

  #dispatch<E extends MaplibreglGeocodingControlEventName>(
    type: E,
    detail?: Omit<MaplibreglGeocodingControlEventNameMap[E], "type" | "target" | "marker"> & { marker?: MarkerType },
  ): this {
    return this.fire({ type, ...(detail ?? {}) } as unknown as EventNameMap[Extract<keyof EventNameMap, string>]);
  }

  #goToPicked(picked: Feature) {
    if (picked.bbox[0] === picked.bbox[2] && picked.bbox[1] === picked.bbox[3]) {
      this.#flyTo(picked.center, this.#computeZoom(picked));
    } else {
      this.#fitBounds(unwrapBbox(picked.bbox), 50, this.#computeZoom(picked));
    }
  }

  #zoomToResults({ detail: { features, external } }: MaptilerGeocoderEvent.FeaturesListedEvent) {
    if (
      !features ||
      features.length === 0 ||
      !this.#flyToEnabled ||
      this.#options.flyToFeatures === false ||
      this.#options.flyToFeatures === "never" ||
      (!external && (this.#options.flyToFeatures === undefined || this.#options.flyToFeatures === "external"))
    )
      return;

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

    if (!coordinates) {
      this.#reverseMarker?.remove();
      this.#reverseMarker = undefined;
      return;
    }

    if (!this.#reverseMarker) {
      if (this.#options.marker instanceof Function) {
        this.#reverseMarker = this.#options.marker(this.#map) ?? undefined;
      } else {
        this.#reverseMarker = this.#createMarker(this.#map, this.#options.marker, coordinates);
        this.#reverseMarker.getElement().classList.add("marker-reverse");
      }
    }

    this.#reverseMarker?.setLngLat(coordinates);
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

      const marker = this.#options.marker instanceof Function ? this.#options.marker(this.#map, picked) : this.#createMarker(this.#map, this.#options.marker, picked.center);
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
        if (feature.id === picked?.id || feature.place_type.includes("reverse")) {
          continue;
        }

        let marker;

        if (this.#options.showResultMarkers instanceof Function) {
          marker = this.#options.showResultMarkers(this.#map, feature);

          if (!marker) {
            continue;
          }
        } else {
          marker = this.#createMarker(this.#map, this.#options.showResultMarkers, feature.center, (marker) => {
            this.setMarkerPopup(
              marker,
              { offset: [1, -27], closeButton: false, closeOnMove: true, className: "maptiler-gc-popup" },
              feature.place_type[0] === "reverse" ? feature.place_name : feature.place_name.replace(/,.*/, ""),
            );
          });

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

        element.classList.toggle("marker-fuzzy", !!feature.matching_text);

        this.#markers.set(feature, marker);
      }
    }
  }

  #setSelectedMarker(feature: Feature): void {
    this.#selectedMarker?.getElement().classList.toggle("marker-selected", false);
    this.#selectedMarker = undefined;

    if (this.#options.markerOnSelected !== false) {
      this.#selectedMarker = this.#markers.get(feature);
      this.#selectedMarker?.getElement().classList.toggle("marker-selected", true);
    }
  }

  #syncFullGeometryLayer() {
    if (!this.#map?._loaded) {
      void this.#map?.once("load", () => {
        this.#syncFullGeometryLayer();
      });
      return;
    }

    const effFullGeometryStyle = this.#getFullGeometryStyle();
    const source = this.#map.getSource<GeoJSONSource>(RESULT_SOURCE);

    if ((!effFullGeometryStyle?.fill && !effFullGeometryStyle?.line) || (!source && !this.#savedData)) {
      return;
    }

    if (source) {
      void source.setData(this.#savedData ?? featureCollection([]));
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

  /** Creates the marker (the default one, unless options are given), sets it up and adds it to the map */
  #createMarker(map: MapType, options: MarkerOptionsType | true | undefined, lngLat: Position, setUp?: (marker: MarkerType) => void): MarkerType {
    const marker = this.createMarker(typeof options === "object" ? options : { element: map._container.ownerDocument.createElement("maptiler-geocode-marker"), offset: [1, -13] });
    marker.setLngLat(lngLat);
    setUp?.(marker);
    this.addMarker(map, marker);
    return marker;
  }

  #getFullGeometryStyle() {
    const { fullGeometryStyle } = this.#options;
    if (fullGeometryStyle === true || fullGeometryStyle === undefined) return DEFAULT_GEOMETRY_STYLE;
    if (fullGeometryStyle === false || fullGeometryStyle === null) return undefined;
    return fullGeometryStyle;
  }
}

/* eslint-disable @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars */
/** The control is `Evented`, but only by the methods copied with `mixinEvented()` in the subclass (type parameters must match the class) */
export interface MaplibreglGeocodingControlBase<
  Options extends Omit<MaplibreglGeocodingControlOptions, "marker" | "showResultMarkers"> & MarkerOptionsOf<MapType, MarkerType, MarkerOptionsType>,
  EventNameMap extends Record<MaplibreglGeocodingControlEventName, { readonly type: string }>,
  MapType extends MLMap,
  MarkerType extends MarkerLike,
  MarkerOptionsType extends object,
> extends Evented<EventNameMap> {}
/* eslint-enable @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars */
