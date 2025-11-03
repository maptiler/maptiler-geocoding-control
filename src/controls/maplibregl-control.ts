/* eslint-disable @typescript-eslint/no-unnecessary-condition */ // @TODO fix this so it is not necessary
import maplibregl from "maplibre-gl";

import { feature, featureCollection } from "@turf/helpers";
import union from "@turf/union";
import type { GeoJSON, LineString, MultiLineString, MultiPolygon, Polygon } from "geojson";

import { setMask } from "../utils/mask";

const Evented = maplibregl.Evented;
const Marker = maplibregl.Marker;
const Popup = maplibregl.Popup;

type FillLayerSpecification = maplibregl.FillLayerSpecification;
type FitBoundsOptions = maplibregl.FitBoundsOptions;
type FlyToOptions = maplibregl.FlyToOptions;
type GeoJSONSource = maplibregl.GeoJSONSource;
type IControl = maplibregl.IControl;
type LineLayerSpecification = maplibregl.LineLayerSpecification;
type Listener = maplibregl.Listener;
type MapMouseEvent = maplibregl.MapMouseEvent;
type Marker = maplibregl.Marker;
type MarkerOptions = maplibregl.MarkerOptions;
type MLEvent = maplibregl.Event;
type MLMap = maplibregl.Map;
type Subscription = maplibregl.Subscription;

export type FullGeometryStyle = {
  fill: Pick<FillLayerSpecification, "layout" | "paint" | "filter">;
  line: Pick<LineLayerSpecification, "layout" | "paint" | "filter">;
};

import type { BBox, ControlOptions, DispatcherType, Feature, FeatureCollection, PickedResultStyle, Position, RedefineType } from "../types";
import { unwrapBbox } from "../utils/geo-utils";

import "../geocoder/geocoder";
import { type MaptilerGeocoderElement } from "../geocoder/geocoder";

import "../components/marker";

export const ZOOM_DEFAULTS: Record<string, number> = {
  continental_marine: 4,
  country: 4,
  major_landform: 8,
  region: 5,
  subregion: 6,
  county: 7,
  joint_municipality: 8,
  joint_submunicipality: 9,
  municipality: 10,
  municipal_district: 11,
  locality: 12,
  neighbourhood: 13,
  place: 14,
  postal_code: 14,
  road: 16,
  poi: 17,
  address: 18,
  "poi.peak": 15,
  "poi.shop": 18,
  "poi.cafe": 18,
  "poi.restaurant": 18,
  "poi.aerodrome": 13,
  // TODO add many more
};

const defaultGeometryStyle: FullGeometryStyle = {
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
};

const RESULT_SOURCE = "mtlr-gc-full-geom";

const RESULT_LAYER_FILL = "mtlr-gc-full-geom-fill";

const RESULT_LAYER_LINE = "mtlr-gc-full-geom-line";

export class MaplibreglGeocodingControl extends Evented implements IControl {
  #options: MapLibreBaseControlOptions;
  #map?: MLMap;
  #element?: MaptilerGeocoderElement;

  constructor(options: MapLibreBaseControlOptions = {}) {
    super();
    this.#options = options;
  }

  onAdd(map: MLMap): MaptilerGeocoderElement {
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
    this.#element.setOptions(this.#options);
    this.#addEventListeners();
    return this.#element;
  }

  onRemove(): void {
    // this.#removeEventListeners(); // @TODO is it needed? - it is, for map at least
    this.#map = undefined;
    this.#element = undefined;
  }

  // event helpers
  on<T extends keyof EventTypes>(type: T, listener: (ev: EventTypes[T]) => void): Subscription; // TODO add backward type compatibility; in MapLibre v4 it returns `this`.

  on(type: keyof EventTypes, listener: Listener): Subscription {
    return super.on(type, listener);
  }

  once<T extends keyof EventTypes>(type: T, listener?: (ev: EventTypes[T]) => void): this | Promise<unknown>;

  once(type: keyof EventTypes, listener?: Listener): this | Promise<unknown> {
    return super.once(type, listener);
  }

  off<T extends keyof EventTypes>(type: T, listener: (ev: EventTypes[T]) => void): this;

  off(type: keyof EventTypes, listener: Listener): this {
    return super.off(type, listener);
  }

  listens(type: keyof EventTypes): boolean;

  listens(type: keyof EventTypes): boolean {
    return super.listens(type);
  }

  /**
   * Update the control options.
   *
   * @param options options to update
   */
  setOptions(options: MapLibreBaseControlOptions) {
    Object.assign(this.#options, options);
    this.#element?.setOptions(options);
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
    this.markedFeatures = [];
    // this.picked = undefined;
    // @TODO there might need to be some reaction too
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

  //
  //
  //
  //
  //
  //
  //
  //
  //
  //

  // @TODO move methods from mapController into an abstract parent class that is going to be a parent of all separate controls for different libraries
  // mapController!: MapController;

  // @TODO change this to #prop - these are properties (input options)
  private zoom: Record<string, number> = ZOOM_DEFAULTS;
  private flyTo: boolean = true;
  private flyToSelected: boolean = false;
  // @TODO change this to #prop - these are state
  #prevIdToFly?: string; // was not state nor prop before
  private markedFeatures?: Feature[];

  //
  //
  //

  #markers = new Map<Feature, Marker>();
  #selectedMarker: Marker | undefined;
  #reverseMarker: Marker | undefined;
  #savedData: GeoJSON | undefined; // used to restore features on style switch

  //
  //
  //

  #addEventListeners() {
    if (!this.#element || !this.#map) return;

    //
    //
    //

    this.#element.addEventListener("querychange", (event) => {
      const coords = (event as MaptilerGeocoderElement.QueryChangeEvent).detail.reverseCoords;

      this.#setReverseMarker(coords ? [coords.decimalLongitude, coords.decimalLatitude] : undefined);
    });
    this.#element.addEventListener("queryclear", () => {
      this.#setReverseMarker(undefined);
    });
    this.#element.addEventListener("featureslisted", (event) => {
      const features = (event as MaptilerGeocoderElement.FeaturesListedEvent).detail.features;
      this.markedFeatures = features;
      this.#setFeatures(this.markedFeatures, undefined);
      this.#zoomToResults(features);
    });
    this.#element.addEventListener("featuresclear", () => {
      this.markedFeatures = undefined;

      // this.#setFeatures(this.#selected ? [this.#selected] : undefined, this.picked);
      this.#setFeatures(undefined, undefined);

      //mapController.setSelectedMarker(this.#selected ? 0 : -1);
    });
    this.#element.addEventListener("select", (event) => {
      const selected = (event as MaptilerGeocoderElement.SelectEvent).detail.feature;
      if (selected && this.flyTo && this.flyToSelected) {
        this.#flyTo(selected.center, this.#computeZoom(selected));
      }
      if (this.markedFeatures && selected) {
        // highlight selected marker
        this.#setSelectedMarker(selected);
      }
    });
    this.#element.addEventListener("pick", (event) => {
      const picked = (event as MaptilerGeocoderElement.PickEvent).detail.feature;
      if (picked && picked.id !== this.#prevIdToFly && this.flyTo) {
        this.#goToPicked(picked);

        // if (this.#options.clearListOnPick) {
        //   this.listFeatures = undefined;
        // }

        this.#setFeatures(this.markedFeatures, picked);

        // this.markedFeatures = undefined;
        // this.selectedItemIndex = -1;
      }

      this.#prevIdToFly = picked?.id;

      // if (["markedFeatures", "picked"].some(prop => changedProperties.has(prop)) && mapController) {
      //   this.#setFeatures(this.markedFeatures, picked, this.#showPolygonMarker);
      // }
    });
    this.#element.addEventListener("reversetoggle", (event) => {
      const reverse = (event as MaptilerGeocoderElement.ReverseToggleEvent).detail.reverse;
      const canvasContainer = this.#map?.getCanvasContainer();
      if (canvasContainer) {
        canvasContainer.style.cursor = reverse ? "crosshair" : "";
      }
    });

    this.#map.on("render", () => {
      const zoom = this.#map?.getZoom();
      const center = this.#map?.getCenter();
      this.#element?.handleMapChange(zoom && center ? [zoom, center.lng, center.lat] : undefined);
    });

    this.#map.on("click", (e: MapMouseEvent) => {
      this.#element?.handleMapClick([e.lngLat.lng, e.lngLat.lat]);
    });

    this.#map.on("styledata", () => {
      setTimeout(() => {
        if (this.#savedData) {
          this.#syncFullGeometryLayer();
        }
      });
    });
  }

  //
  //
  //

  #goToPicked(picked: Feature) {
    if (!picked) return;

    if (!picked.bbox || (picked.bbox[0] === picked.bbox[2] && picked.bbox[1] === picked.bbox[3])) {
      this.#flyTo(picked.center, this.#computeZoom(picked));
    } else {
      // @TODO this is temporary code to just try that, to be replaced with the original one below
      const ubbox = unwrapBbox(picked.bbox);
      this.#map?.fitBounds(
        [
          [ubbox[0], ubbox[1]],
          [ubbox[2], ubbox[3]],
        ],
        { padding: 50, ...(this.#computeZoom(picked) ? { maxZoom: this.#computeZoom(picked) } : {}) },
      );

      this.#fitBounds(unwrapBbox(picked.bbox), 50, this.#computeZoom(picked));
    }
  }

  #zoomToResults(features: Feature[] | undefined) {
    if (!features || features.length === 0 || !this.flyTo) return;

    const fuzzyOnly = features.every((feature) => feature.matching_text);
    const bbox = features.reduce<BBox>(
      (bbox, feature) =>
        fuzzyOnly || !feature.matching_text
          ? [
              Math.min(bbox[0], feature.bbox?.[0] ?? feature.center[0]),
              Math.min(bbox[1], feature.bbox?.[1] ?? feature.center[1]),
              Math.max(bbox[2], feature.bbox?.[2] ?? feature.center[0]),
              Math.max(bbox[3], feature.bbox?.[3] ?? feature.center[1]),
            ]
          : bbox,
      [180, 90, -180, -90],
    );

    const allZoom = features
      .map((feature) => this.#computeZoom(feature))
      .filter((zoom) => zoom !== undefined)
      .reduce<number | undefined>((allZoom, featZoom) => (allZoom === undefined ? featZoom : Math.max(allZoom, featZoom)), undefined);

    // @TODO this is temporary code to just try that, to be replaced with the original one below
    const ubbox = unwrapBbox(bbox);
    this.#map?.fitBounds(
      [
        [ubbox[0], ubbox[1]],
        [ubbox[2], ubbox[3]],
      ],
      { padding: 50, ...(allZoom ? { maxZoom: allZoom } : {}) },
    );
    this.#fitBounds(unwrapBbox(bbox), 50, allZoom);

    // if (this.mapController) {
    //   if (this.picked && bbox[0] === bbox[2] && bbox[1] === bbox[3]) {
    //     this.mapController.flyTo(this.picked.center, this.#computeZoom(this.picked));
    //   } else {
    //     this.#fitBounds(unwrapBbox(bbox), 50, allZoom);
    //   }
    // }
  }

  #computeZoom(feature: Feature): number | undefined {
    if (!feature.bbox || (feature.bbox[0] !== feature.bbox[2] && feature.bbox[1] !== feature.bbox[3])) {
      return undefined;
    }

    const index = feature.id.replace(/\..*/, "");

    return (
      (Array.isArray(feature.properties?.categories)
        ? (feature.properties.categories as string[]).reduce<number | undefined>((a, category) => {
            const b = this.zoom[index + "." + category];

            return a === undefined ? b : b === undefined ? a : Math.max(a, b);
          }, undefined)
        : undefined) ?? this.zoom[index]
    );
  }

  //
  //
  //

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
        this.#reverseMarker = (typeof this.#options.marker === "object" ? new Marker(this.#options.marker) : this.#createMarker()).setLngLat(coordinates).addTo(this.#map);

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

    block: if (picked) {
      let handled = false;

      if (picked.geometry.type === "GeometryCollection") {
        const geoms = picked.geometry.geometries.filter((geometry): geometry is Polygon | MultiPolygon => geometry.type === "Polygon" || geometry.type === "MultiPolygon");

        ok: if (geoms.length > 0) {
          const unioned = union(featureCollection(geoms.map((geom) => feature(geom))));

          if (!unioned) {
            break ok;
          }

          setMask(
            {
              ...picked,
              geometry: unioned.geometry,
            },
            (data?: GeoJSON) => {
              this.#setAndSaveData(data);
            },
          );

          handled = true;
        } else {
          const geometries = picked.geometry.geometries.filter(
            (geometry): geometry is LineString | MultiLineString => geometry.type === "LineString" || geometry.type === "MultiLineString",
          );

          if (geometries.length > 0) {
            this.#setAndSaveData({
              ...picked,
              geometry: { type: "GeometryCollection", geometries },
            });

            handled = true;
          }
        }
      }

      if (handled) {
        // nothing
      } else if (picked.geometry.type === "Polygon" || picked.geometry.type === "MultiPolygon") {
        setMask(picked as Feature<Polygon | MultiPolygon>, (data?: GeoJSON) => {
          this.#setAndSaveData(data);
        });
      } else if (picked.geometry.type === "LineString" || picked.geometry.type === "MultiLineString") {
        this.#setAndSaveData(picked);

        break block; // no pin for (multi)linestrings
      }

      if (this.#options.pickedResultStyle !== "full-geometry-including-polygon-center-marker" && !picked.geometry.type.endsWith("Point")) {
        break block;
      }

      if (this.#options.marker === false || this.#options.marker === null) {
        break block;
      }

      if (this.#options.marker instanceof Function) {
        const m = this.#options.marker(this.#map, picked);

        if (m) {
          this.#markers.set(picked, m);
        }
      } else {
        this.#markers.set(picked, (typeof this.#options.marker === "object" ? new Marker(this.#options.marker) : this.#createMarker()).setLngLat(picked.center).addTo(this.#map));
      }
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
          marker = (typeof this.#options.showResultMarkers === "object" ? new Marker(this.#options.showResultMarkers) : this.#createMarker(true))
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
        }

        const element = marker.getElement();

        element.addEventListener("click", (e) => {
          e.stopPropagation();
          this.fire("markerClick", { id: feature.id });
        });

        element.addEventListener("mouseenter", () => {
          this.fire("markerMouseEnter", { id: feature.id });
          marker.togglePopup();
        });

        element.addEventListener("mouseleave", () => {
          this.fire("markerMouseLeave", { id: feature.id });
          marker.togglePopup();
        });

        // element.classList.toggle("marker-fuzzy", !!feature.matching_text);

        this.#markers.set(feature, marker);
      }
    }
  }

  #setSelectedMarker(feature: Feature): void {
    if (this.#selectedMarker) {
      this.#selectedMarker.getElement().classList.toggle("marker-selected", false);
    }

    this.#selectedMarker = this.#markers.get(feature);

    this.#selectedMarker?.getElement().classList.toggle("marker-selected", true);
  }

  //
  //
  //
  //
  //
  //
  //
  //
  //
  //

  #syncFullGeometryLayer() {
    if (!this.#map?.loaded) {
      void this.#map?.once("load", () => {
        this.#syncFullGeometryLayer();
      });
      return;
    }

    const effFullGeometryStyle = !this.#options.fullGeometryStyle ? undefined : this.#options.fullGeometryStyle === true ? defaultGeometryStyle : this.#options.fullGeometryStyle;

    if (!effFullGeometryStyle?.fill && !effFullGeometryStyle?.line) {
      return;
    }

    const source = this.#map.getSource<GeoJSONSource>(RESULT_SOURCE);

    if (source) {
      source.setData(this.#savedData ?? featureCollection([]));
    } else if (this.#savedData) {
      this.#map.addSource(RESULT_SOURCE, {
        type: "geojson",
        data: this.#savedData,
      });
    } else {
      return;
    }

    if (!this.#map.getLayer(RESULT_LAYER_FILL) && effFullGeometryStyle?.fill) {
      this.#map.addLayer({
        ...effFullGeometryStyle?.fill,
        id: RESULT_LAYER_FILL,
        type: "fill",
        source: RESULT_SOURCE,
      });
    }

    if (!this.#map.getLayer(RESULT_LAYER_LINE) && effFullGeometryStyle?.line) {
      this.#map.addLayer({
        ...effFullGeometryStyle?.line,
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

  // map.on("styledata", () => {
  //   // timeout prevents collision with svelte-maplibre library
  //   setTimeout(() => {
  //     if (savedData) {
  //       syncFullGeometryLayer();
  //     }
  //   });
  // });

  #createMarker(interactive = false) {
    // @TODO this.map.container.ownerDocument
    const element = document.createElement("maptiler-geocode-marker");

    if (interactive) {
      element.classList.add("marker-interactive");
    }

    return new Marker({ element, offset: [1, -13] });
  }
}

// @TODO refactor original Event implementation to be less overengineered
type EventTypes = RedefineType<
  DispatcherType,
  {
    select: SelectEvent;
    featureslisted: FeaturesListedEvent;
    featuresmarked: FeaturesMarkedEvent;
    optionsvisibilitychange: OptionsVisibilityChangeEvent;
    pick: PickEvent;
    querychange: QueryChangeEvent;
    response: ResponseEvent;
    reversetoggle: ReverseToggleEvent;
  }
>;

// NOTE We can't use Maplibre `Event` - see https://github.com/maplibre/maplibre-gl-js/issues/5015
class Event<TYPE extends string> implements MLEvent {
  readonly type: TYPE;
  readonly target: MaplibreglGeocodingControl;

  constructor(target: MaplibreglGeocodingControl, type: TYPE) {
    this.type = type;
    this.target = target;
  }
}

class SelectEvent extends Event<"select"> {
  feature: Feature | undefined;

  constructor(target: MaplibreglGeocodingControl, details: { feature: Feature | undefined }) {
    super(target, "select");

    Object.assign(this, details);
  }
}

class FeaturesListedEvent extends Event<"featureslisted"> {
  features: Feature[] | undefined;

  constructor(target: MaplibreglGeocodingControl, features: Feature[] | undefined) {
    super(target, "featureslisted");

    this.features = features;
  }
}

class FeaturesMarkedEvent extends Event<"featuresmarked"> {
  features: Feature[] | undefined;

  constructor(target: MaplibreglGeocodingControl, features: Feature[] | undefined) {
    super(target, "featuresmarked");

    this.features = features;
  }
}

class OptionsVisibilityChangeEvent extends Event<"optionsvisibilitychange"> {
  optionsVisible: boolean;

  constructor(target: MaplibreglGeocodingControl, optionsVisible: boolean) {
    super(target, "optionsvisibilitychange");

    this.optionsVisible = optionsVisible;
  }
}

class PickEvent extends Event<"pick"> {
  feature: Feature | undefined;

  constructor(target: MaplibreglGeocodingControl, feature: Feature | undefined) {
    super(target, "pick");

    this.feature = feature;
  }
}

class QueryChangeEvent extends Event<"querychange"> {
  query: string;

  constructor(target: MaplibreglGeocodingControl, query: string) {
    super(target, "querychange");

    this.query = query;
  }
}

class ResponseEvent extends Event<"response"> {
  url: string;

  featureCollection: FeatureCollection;

  constructor(target: MaplibreglGeocodingControl, url: string, featureCollection: FeatureCollection) {
    super(target, "response");

    this.url = url;

    this.featureCollection = featureCollection;
  }
}

class ReverseToggleEvent extends Event<"reversetoggle"> {
  reverse: boolean;

  constructor(target: MaplibreglGeocodingControl, reverse: boolean) {
    super(target, "reversetoggle");

    this.reverse = reverse;
  }
}

export type MapLibreBaseControlOptions = Omit<ControlOptions, "apiKey"> & {
  /**
   * Maptiler API key. Optional if used with MapTiler SDK.
   */
  apiKey?: string;

  /**
   * Marker to be added to the map at the location of the user-selected result using a default set of Marker options.
   *
   * - If `true` or `undefined` then a default marker will be used.
   * - If the value is a [MarkerOptions](https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MarkerOptions/) then the marker will be constructed using these options.
   * - If the value is a function then it can return instance of the [Marker](https://maplibre.org/maplibre-gl-js/docs/API/classes/Marker/).
   *   Function can accept `Feature` as a parameter which is `undefined` for the reverse location marker.
   * - If `false` or `null` then no marker will be added to the map.
   *
   * Requires that `options.maplibregl` also be set.
   *
   * Default value is `true`.
   */
  marker?: null | boolean | MarkerOptions | ((map: MLMap, feature?: Feature) => undefined | null | Marker);

  /**
   * Marker be added to the map at the location the geocoding results.
   *
   * - If `true` or `undefined` then a default marker will be used.
   * - If the value is a [MarkerOptions](https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MarkerOptions/) then the marker will be constructed using these options.
   * - If the value is a function then it can return instance of the [Marker](https://maplibre.org/maplibre-gl-js/docs/API/classes/Marker/).
   *   In this case the default pop-up won't be added to the marker.
   *   Function can accept `Feature` as a parameter.
   * - If `false` or `null` then no marker will be added to the map.
   *
   * Requires that `options.maplibregl` also be set.
   *
   * Default value is `true`.
   */
  showResultMarkers?: null | boolean | MarkerOptions | ((map: MLMap, feature: Feature) => undefined | null | Marker);

  /**
   * Animation to selected feature on the map.
   *
   * - If `false` or `null` then animating the map to a selected result is disabled.
   * - If `true` or `undefined` then animating the map will use the default animation parameters.
   * - If an [FlyToOptions](https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/FlyToOptions/)
   *     ` & `[FitBoundsOptions](https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/FitBoundsOptions/)
   *     then it will be passed as options to the map [flyTo](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/#flyto)
   *     or [fitBounds](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/#fitbounds) method providing control over the animation of the transition.
   *
   * Default value is `true`.
   */
  flyTo?: null | boolean | (FlyToOptions & FitBoundsOptions);

  /**
   * Style for full feature geometry GeoJSON.
   *
   * - If `false` or `null` then no full geometry is drawn.
   * - If `true` or `undefined` then default-styled full geometry is drawn.
   * - If an T then it must represent the style and will be used to style the full geometry.
   *
   * Default is the default style.
   */
  fullGeometryStyle?: null | boolean | FullGeometryStyle;

  /**
   * Style of the picked result on the map:
   * - `"marker-only"`: Show only a marker at the center of the feature.
   * - `"full-geometry"`: Display the full feature geometry.
   * - `"full-geometry-including-polygon-center-marker"`: Display full geometry with a marker at the polygon center.
   *
   * Default: `"full-geometry"`.
   */
  pickedResultStyle?: PickedResultStyle;
};
