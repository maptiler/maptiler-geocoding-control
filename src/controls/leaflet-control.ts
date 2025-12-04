import bbox from "@turf/bbox";
import { feature, featureCollection } from "@turf/helpers";
import union from "@turf/union";
import type { GeometryCollection, LineString, MultiLineString, MultiPolygon, Polygon } from "geojson";
import {
  Control,
  type ControlOptions,
  DivIcon,
  DomEvent,
  Evented,
  GeoJSON,
  type LatLng,
  type LatLngLiteral,
  type LeafletMouseEvent,
  type Map as LMap,
  Marker,
  type MarkerOptions,
  Popup,
  type PopupOptions,
} from "leaflet";

import type { BBox, Feature } from "../types";
import { shiftPolyCollection, unwrapBbox } from "../utils/geo-utils";
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

import type { LeafletGeocodingControlEventName, LeafletGeocodingControlEventNameMap } from "./leaflet-events";
import { DEFAULT_GEOMETRY_STYLE, type LeafletGeocodingControlOptions, ZOOM_DEFAULTS } from "./leaflet-options";

/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
/** Base class for Control needs to extend both Control and Evented */
abstract class EventedControl<Options extends ControlOptions> extends Control {
  override options!: Options;
}
Object.assign(EventedControl.prototype, Evented.prototype);
interface EventedControl<Options extends ControlOptions> extends Control, Evented {
  options: Options;
}
/* eslint-enable @typescript-eslint/no-unsafe-declaration-merging */

export class LeafletGeocodingControl extends EventedControl<LeafletGeocodingControlOptions> {
  #map?: LMap;
  #element?: MaptilerGeocoderElement;

  constructor(options: LeafletGeocodingControlOptions = {}) {
    super(options);
  }

  onAdd(map: LMap): HTMLElement {
    this.#map = map;
    this.#element = map.getContainer().ownerDocument.createElement("maptiler-geocoder");
    this.#element.classList.add("leaflet-geocoder");

    this.#setElementOptions();
    this.#addEventListeners();
    this.#addResultLayer();

    const div = map.getContainer().ownerDocument.createElement("div");
    div.classList.add("leaflet-ctrl-geocoder", "leaflet-bar");
    div.appendChild(this.#element as Node);

    DomEvent.disableClickPropagation(div);
    DomEvent.disableScrollPropagation(div);

    return div;
  }

  onRemove(): void {
    this.#removeEventListeners();
    this.#removeResultLayer();
    this.#map = undefined;
    this.#element = undefined;
  }

  /**
   * Update the control options.
   *
   * @param options options to update
   */
  setOptions(options: LeafletGeocodingControlOptions) {
    Object.assign(this.options, options);
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

  /** Markers currently displayed on the map */
  #markers = new Map<Feature, Marker>();
  /** Marker representing the selected feature */
  #selectedMarker: Marker | undefined;
  /** Marker representing the picked feature */
  #reverseMarker: Marker | undefined;
  /** Features currently marked on the map */
  #markedFeatures?: Feature[];
  /** Remember last feature that the map flew to as to not do it again */
  #prevIdToFly?: string;
  /** Layer used for showing geometry results */
  #resultLayer?: GeoJSON;

  #elementEventListeners: { [EventName in MaptilerGeocoderEventName]: (e: MaptilerGeocoderEventNameMap[EventName]) => void } = {
    reversetoggle: (event: ReverseToggleEvent) => {
      const container = this.#map?.getContainer();
      if (container) {
        container.style.cursor = event.detail.reverse ? "crosshair" : "";
      }
      this.#dispatch("reversetoggle", event.detail);
    },
    querychange: (event: QueryChangeEvent) => {
      const coords = (event as QueryChangeEvent).detail.reverseCoords;

      this.#setReverseMarker(coords ? { lng: coords.decimalLongitude, lat: coords.decimalLatitude } : undefined);
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
      if (selected && this.#flyToEnabled && this.options.flyToSelected) {
        this.#flyTo({ lng: selected.center[0], lat: selected.center[1] }, this.#computeZoom(selected));
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
    click: (e: LeafletMouseEvent) => {
      this.#element?.handleMapClick([e.latlng.lng, e.latlng.lat]);
    },
  };

  #setElementOptions() {
    if (!this.#element) return;

    this.#element.setOptions(this.options);
    this.#element.fetchFullGeometryOnPick = this.options.pickedResultStyle !== "marker-only";
  }

  #addEventListeners() {
    if (!this.#element || !this.#map) return;

    for (const [type, listener] of Object.entries(this.#elementEventListeners)) {
      this.#element.addEventListener(type as MaptilerGeocoderEventName, listener as EventListener);
    }

    this.#map.on(this.#mapEventListeners);
  }

  #removeEventListeners() {
    if (!this.#element || !this.#map) return;

    for (const [type, listener] of Object.entries(this.#elementEventListeners)) {
      this.#element.removeEventListener(type as MaptilerGeocoderEventName, listener as EventListener);
    }

    this.#map.off(this.#mapEventListeners);
  }

  #dispatch<E extends LeafletGeocodingControlEventName>(type: E, detail?: LeafletGeocodingControlEventNameMap[E]): this {
    return super.fire(type, detail);
  }

  #goToPicked(picked: Feature) {
    if (picked.bbox[0] === picked.bbox[2] && picked.bbox[1] === picked.bbox[3]) {
      this.#flyTo({ lng: picked.center[0], lat: picked.center[1] }, this.#computeZoom(picked));
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
    const zoomMap = this.options.zoom ?? ZOOM_DEFAULTS;

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
    return Boolean(this.options.flyTo) || this.options.flyTo === undefined;
  }
  get #flyToOptions() {
    return typeof this.options.flyTo === "boolean" ? {} : this.options.flyTo;
  }
  get #fitBoundsOptions() {
    return typeof this.options.flyTo === "boolean" ? {} : this.options.flyTo;
  }

  #flyTo(center: LatLng | LatLngLiteral, zoom?: number): void {
    this.#map?.flyTo(center, zoom, this.#flyToOptions ?? undefined);
  }

  #fitBounds(bbox: BBox, padding: number, maxZoom?: number): void {
    this.#map?.fitBounds(
      [
        [bbox[1], bbox[0]],
        [bbox[3], bbox[2]],
      ],
      { padding: [padding, padding], ...(maxZoom ? { maxZoom } : {}), ...this.#fitBoundsOptions },
    );
  }

  #setReverseMarker(coordinates?: LatLng | LatLngLiteral) {
    if (this.options.marker === false || this.options.marker === null || !this.#map) {
      return;
    }

    if (this.#reverseMarker) {
      if (!coordinates) {
        this.#reverseMarker.remove();

        this.#reverseMarker = undefined;
      } else {
        this.#reverseMarker.setLatLng(coordinates);
      }
    } else if (coordinates) {
      if (this.options.marker instanceof Function) {
        this.#reverseMarker = this.options.marker(this.#map) ?? undefined;
      } else {
        this.#reverseMarker = this.#createMarker(coordinates, this.options.marker).addTo(this.#map);
        this.#reverseMarker.getElement()?.classList.add("marker-reverse");
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

    this.#resultLayer?.clearLayers();

    const addMarker = () => {
      if (!picked || !this.#map || this.options.marker === false || this.options.marker === null) return;

      const marker =
        this.options.marker instanceof Function
          ? this.options.marker(this.#map, picked)
          : this.#createMarker({ lng: picked.center[0], lat: picked.center[1] }, this.options.marker).addTo(this.#map);
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
            // leaflet doesn't repeat features every 360 degrees along longitude so we clone it manually to the direction(s) which could be displayed when auto-zoomed on the feature
            const features = [...mask.features];
            const bb = unwrapBbox(bbox(picked) as BBox);
            const span = bb[2] - bb[0];

            if (bb[0] - span / 4 < -180) {
              features.push(...shiftPolyCollection(mask, -360).features);
            }

            if (bb[2] + span / 4 > 180) {
              features.push(...shiftPolyCollection(mask, 360).features);
            }

            this.#resultLayer?.addData(featureCollection(features));
          }
        }
      } else {
        const lineGeometries = picked.geometry.geometries.filter(
          (geometry): geometry is LineString | MultiLineString => geometry.type === "LineString" || geometry.type === "MultiLineString",
        );

        if (lineGeometries.length > 0) {
          this.#resultLayer?.addData({
            ...picked,
            geometry: { type: "GeometryCollection", geometries: lineGeometries },
          } as Feature<GeometryCollection>);
        }
      }
    } else if (picked?.geometry.type.endsWith("Polygon")) {
      const mask = getMask(picked as Feature<Polygon | MultiPolygon>);
      if (mask) {
        this.#resultLayer?.addData(mask);
      }
      if (this.options.pickedResultStyle === "full-geometry-including-polygon-center-marker") {
        addMarker();
      }
    } else if (picked?.geometry.type.endsWith("LineString")) {
      this.#resultLayer?.addData(picked);
    } else if (picked?.geometry.type.endsWith("Point")) {
      addMarker();
    }

    if (this.options.showResultMarkers !== false && this.options.showResultMarkers !== null) {
      for (const feature of markedFeatures ?? []) {
        if (feature.id === picked?.id) {
          continue;
        }

        let marker;

        if (this.options.showResultMarkers instanceof Function) {
          marker = this.options.showResultMarkers(this.#map, feature);

          if (!marker) {
            continue;
          }
        } else {
          marker = this.#createMarker({ lng: feature.center[0], lat: feature.center[1] }, this.options.showResultMarkers)
            .bindPopup(
              new Popup({
                offset: [0.3, -21],
                closeButton: false,
                closeOnMove: true,
                className: "maptiler-gc-popup",
              } as PopupOptions).setContent(feature.place_type[0] === "reverse" ? feature.place_name : feature.place_name.replace(/,.*/, "")),
            )
            .addTo(this.#map);

          marker.getElement()?.classList.add("marker-interactive");
        }

        const element = marker.getElement();

        element?.addEventListener("click", (e) => {
          e.stopPropagation();
          this.#dispatch("markerclick", { feature, marker });
        });

        element?.addEventListener("mouseenter", () => {
          this.#dispatch("markermouseenter", { feature, marker });
          marker.togglePopup();
        });

        element?.addEventListener("mouseleave", () => {
          this.#dispatch("markermouseleave", { feature, marker });
          marker.togglePopup();
        });

        element?.classList.toggle("marker-fuzzy", !!feature.matching_text);

        this.#markers.set(feature, marker);
      }
    }
  }

  #setSelectedMarker(feature: Feature): void {
    this.#selectedMarker?.getElement()?.classList.toggle("marker-selected", false);

    if (this.options.markerOnSelected) {
      this.#selectedMarker = this.#markers.get(feature);
      this.#selectedMarker?.getElement()?.classList.toggle("marker-selected", true);
    } else if (this.#selectedMarker) {
      this.#selectedMarker = undefined;
    }
  }

  #addResultLayer() {
    if (this.#map) {
      this.#resultLayer = new GeoJSON(undefined, {
        style:
          this.options.fullGeometryStyle === true ? DEFAULT_GEOMETRY_STYLE : this.options.fullGeometryStyle === false ? undefined : (this.options.fullGeometryStyle ?? undefined),
        interactive: false,
      }).addTo(this.#map);
    }
  }

  #removeResultLayer() {
    if (this.#map && this.#resultLayer) {
      this.#resultLayer.removeFrom(this.#map);
      this.#resultLayer = undefined;
    }
  }

  #createMarker(center: LatLng | LatLngLiteral, options: MarkerOptions | true | undefined) {
    if (typeof options !== "object") {
      options = { icon: new DivIcon({ html: this.#map?.getContainer().ownerDocument.createElement("maptiler-geocode-marker"), iconAnchor: [12.3, 30], className: "" }) };
    }
    return new Marker(center, options);
  }
}
