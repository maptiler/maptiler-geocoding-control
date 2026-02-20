/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { MultiPolygon, Polygon } from "geojson";
import type { Map as OLMap } from "ol";
import { Feature as OlFeature, type MapBrowserEvent } from "ol";
import type { Types as ObjectEventTypes } from "ol/ObjectEventType";
import type { EventTypes } from "ol/Observable";
import { Control } from "ol/control";
import type { Coordinate } from "ol/coordinate";
import type { EventsKey, ListenerFunction } from "ol/events";
import type BaseEvent from "ol/events/Event";
import {
  GeometryCollection as OlGeometryCollection,
  LineString as OlLineString,
  MultiLineString as OlMultiLineString,
  MultiPolygon as OlMultiPolygon,
  Point as OlPoint,
  Polygon as OlPolygon,
} from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import { fromLonLat, getUserProjection, toLonLat, transformExtent, type Projection } from "ol/proj";
import VectorSource from "ol/source/Vector";

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
import type { GeocodingControlBase } from "./base-control";

import "../components/marker";

import type { OpenLayersGeocodingControlEventName, OpenLayersGeocodingControlEventNameMap } from "./openlayers-events";
import { DEFAULT_GEOMETRY_STYLE, ZOOM_DEFAULTS, type OpenLayersGeocodingControlOptions } from "./openlayers-options";

type TypedBaseEvent<Type extends OpenLayersGeocodingControlEventName> = BaseEvent & { type: Type } & OpenLayersGeocodingControlEventNameMap[Type];

interface EventHandlingMethod {
  (type: EventTypes | ObjectEventTypes, listener: (event: BaseEvent) => unknown): EventsKey;
  <Type extends OpenLayersGeocodingControlEventName>(type: Type, listener: (event: TypedBaseEvent<Type>) => unknown): EventsKey;
  (type: Array<EventTypes | ObjectEventTypes | OpenLayersGeocodingControlEventName>, listener: (event: BaseEvent) => unknown): EventsKey[];
}

const EPSG_SYSTEM = "EPSG:4326";

export class OpenLayersGeocodingControl extends Control implements GeocodingControlBase<OpenLayersGeocodingControlOptions> {
  #options: OpenLayersGeocodingControlOptions;
  #map?: OLMap;
  #element: MaptilerGeocoderElement;

  constructor(options: OpenLayersGeocodingControlOptions = {}) {
    const div = document.createElement("div");

    super({
      element: div,
      ...options,
    });

    this.#options = options;

    this.#element = document.createElement("maptiler-geocoder");
    this.#element.classList.add("openlayers-geocoder");

    this.#setElementOptions();

    div.classList.add("openlayers-ctrl-geocoder");
    div.style.zIndex = "3";
    div.appendChild(this.#element as Node);
  }

  /** @internal Not to be called directly */
  override setMap(map: OLMap | null) {
    super.setMap(map);

    if (this.#map && this.#map !== map) {
      this.#removeEventListeners();
      this.#removeResultLayer();
      this.#map = undefined;
    }

    if (map) {
      this.#map = map;
      this.#addEventListeners();
      this.#addResultLayer();
    }
  }

  getOptions(): OpenLayersGeocodingControlOptions {
    return { ...this.#options };
  }

  setOptions(options: OpenLayersGeocodingControlOptions) {
    Object.assign(this.#options, options);
    this.#setElementOptions();
  }

  setQuery(value: string) {
    this.#element.setQuery(value);
  }

  submitQuery(value: string) {
    this.#element.submitQuery(value);
  }

  clearMap() {
    this.#markedFeatures = [];
    this.#setFeatures(undefined, undefined);
  }

  clearList() {
    this.#element.clearList();
  }

  setReverseMode(reverseActive: boolean) {
    this.setOptions({ reverseActive });
  }

  focus(options?: FocusOptions) {
    this.#element.focus(options);
  }

  blur() {
    this.#element.blur();
  }

  declare on: EventHandlingMethod;
  declare once: EventHandlingMethod;
  declare un: EventHandlingMethod;

  /** Markers currently displayed on the map */
  #markers = new Map<Feature, OlFeature<OlPoint>>();
  /** Marker representing the selected feature */
  #selectedMarker: OlFeature<OlPoint> | undefined;
  /** Marker representing the picked feature */
  #reverseMarker: OlFeature<OlPoint> | undefined;
  /** Features currently marked on the map */
  #markedFeatures?: Feature[];
  /** Remember last feature that the map flew to as to not do it again */
  #prevIdToFly?: string;
  /** Layer used for showing results */
  #resultLayer?: VectorLayer;
  /** Source connected to layer used for showing results */
  #resultSource?: VectorSource;
  /** Last marker the mouse was over, used to detech mouseover and mouseleave events on markers */
  #prevHoveredId?: string;
  /** Flag whether to show reverse geocoding cursor */
  #indicatingReverse = false;

  #elementEventListeners: { [EventName in MaptilerGeocoderEventName]: (e: MaptilerGeocoderEventNameMap[EventName]) => void } = {
    reversetoggle: (event: ReverseToggleEvent) => {
      this.#indicatingReverse = event.detail.reverse;
      this.#dispatch("reversetoggle", event.detail);
    },
    querychange: (event: QueryChangeEvent) => {
      const coords = event.detail.reverseCoords;

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
      const selected = event.detail.feature;
      if (selected && this.#flyToEnabled && this.#options.flyToSelected) {
        this.#flyTo(selected.center, this.#computeZoom(selected));
      }
      if (this.#markedFeatures && selected) {
        this.#setSelectedMarker(selected);
      }
      this.#dispatch("select", event.detail);
    },
    pick: (event: PickEvent) => {
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
    featureslisted: (event: FeaturesListedEvent) => {
      const features = event.detail.features;
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
    postrender: () => {
      const zoom = this.#map?.getView().getZoom();
      const center = this.#map?.getView().getCenter();
      this.#element.handleMapChange(zoom && center ? [zoom, ...this.#transformCoordinateToPosition(center!)] : undefined);
    },
    click: (e: MapBrowserEvent<PointerEvent>) => {
      this.#element.handleMapClick(this.#transformCoordinateToPosition(e.coordinate));
      this.#map?.forEachFeatureAtPixel(e.pixel, (olFeature) => {
        const id = olFeature.getId() as string;
        const feature = this.#markedFeatures?.find((f) => f.id === id);
        if (!id || !feature) return;

        e.stopPropagation();
        this.#dispatch("markerclick", { feature, marker: olFeature as OlFeature<OlPoint> });
        return true;
      });
    },
    pointermove: (e: MapBrowserEvent<PointerEvent>) => {
      if (!this.#map) return;

      const enteredOlFeature = this.#map.forEachFeatureAtPixel(e.pixel, (olFeature) => {
        return olFeature.getId() ? (olFeature as OlFeature<OlPoint>) : undefined;
      });

      this.#map.getTargetElement().style.cursor = enteredOlFeature ? "pointer" : this.#indicatingReverse ? "crosshair" : "";

      const id = enteredOlFeature?.getId() as string | undefined;
      if (this.#prevHoveredId === id) return;

      if (this.#prevHoveredId) {
        const leftFeature = this.#markedFeatures?.find((f) => f.id === this.#prevHoveredId);
        const leftOlFeature = this.#markers.get(leftFeature!);
        leftOlFeature?.set("isMouseOver", false);

        if (leftFeature && leftOlFeature) {
          this.#dispatch("markermouseleave", { feature: leftFeature, marker: leftOlFeature });
        }
      }

      if (enteredOlFeature) {
        const enteredFeature = this.#markedFeatures?.find((f) => f.id === id);

        this.#dispatch("markermouseenter", { feature: enteredFeature!, marker: enteredOlFeature });
        enteredOlFeature.set("isMouseOver", true);
      }

      this.#prevHoveredId = id;
    },
  };

  #setElementOptions() {
    this.#element.setOptions(this.#options);
    this.#element.fetchFullGeometryOnPick = this.#options.pickedResultStyle !== "marker-only";
  }

  #addEventListeners() {
    if (!this.#map) return;

    for (const [type, listener] of Object.entries(this.#elementEventListeners)) {
      this.#element.addEventListener(type as MaptilerGeocoderEventName, listener as EventListener);
    }

    for (const [type, listener] of Object.entries(this.#mapEventListeners)) {
      this.#map.on([type as EventTypes], listener as ListenerFunction);
    }
  }

  #removeEventListeners() {
    if (!this.#map) return;

    for (const [type, listener] of Object.entries(this.#elementEventListeners)) {
      this.#element.removeEventListener(type as MaptilerGeocoderEventName, listener as EventListener);
    }

    for (const [type, listener] of Object.entries(this.#mapEventListeners)) {
      this.#map.un([type as EventTypes], listener as ListenerFunction);
    }
  }

  #dispatch<E extends OpenLayersGeocodingControlEventName>(type: E, detail?: OpenLayersGeocodingControlEventNameMap[E]): void {
    this.dispatchEvent({ type, ...(detail ?? {}) } as BaseEvent);
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
    this.#map?.getView().animate({
      center: this.#transformPositionToCoordinate(center),
      ...(zoom ? { zoom } : {}),
      duration: 2000,
      ...this.#flyToOptions,
    });
  }

  #fitBounds(bbox: BBox, padding: number, maxZoom?: number): void {
    this.#map?.getView().fit(transformExtent(bbox, EPSG_SYSTEM, this.#getProjection()), {
      padding: [padding, padding, padding, padding],
      ...(maxZoom ? { maxZoom } : {}),
      duration: 2000,
      ...this.#fitBoundsOptions,
    });
  }

  #setReverseMarker(position?: Position) {
    if (this.#options.marker === false || !this.#map || !this.#resultSource) {
      return;
    }

    if (!position) {
      if (this.#reverseMarker) {
        this.#resultSource.removeFeature(this.#reverseMarker);
        this.#reverseMarker.dispose();
        this.#reverseMarker = undefined;
      }
      return;
    }

    const coordinates = this.#transformPositionToCoordinate(position);

    if (!this.#reverseMarker) {
      this.#reverseMarker = new OlFeature(new OlPoint(coordinates));
      this.#reverseMarker.set("isReverse", true);
      // this.#styleMarker(this.#reverseMarker);
      this.#resultSource.addFeature(this.#reverseMarker);
      return;
    }

    this.#reverseMarker.getGeometry()!.setCoordinates(coordinates);
  }

  #setFeatures(markedFeatures: Feature[] | undefined, picked: Feature | undefined): void {
    if (!this.#map || !this.#resultSource) {
      return;
    }

    this.#resultSource.removeFeatures([...this.#markers.values()]);
    this.#markers = new Map();

    const addMarker = () => {
      if (!picked || !this.#map || this.#options.marker === false) return;

      const marker = new OlFeature(new OlPoint(this.#transformPositionToCoordinate(picked.center)));
      marker.setId(picked.id);
      this.#markers.set(picked, marker);
      this.#resultSource?.addFeature(marker);
    };

    if (picked?.geometry.type === "GeometryCollection") {
      const polygonGeometries = picked.geometry.geometries
        .map((geometry) => (geometry.type === "Polygon" ? new OlPolygon(geometry.coordinates) : geometry.type === "MultiPolygon" ? new OlMultiPolygon(geometry.coordinates) : null))
        .filter((geometry): geometry is OlPolygon | OlMultiPolygon => Boolean(geometry));

      if (polygonGeometries.length > 0) {
        this.#resultSource.addFeature(new OlFeature(new OlGeometryCollection(polygonGeometries).transform(EPSG_SYSTEM, this.#getProjection())));
      } else {
        for (const geometry of picked.geometry.geometries) {
          if (geometry.type === "LineString") {
            this.#resultSource.addFeature(new OlFeature(new OlLineString(geometry.coordinates).transform(EPSG_SYSTEM, this.#getProjection())));
          } else if (geometry.type === "MultiLineString") {
            this.#resultSource.addFeature(new OlFeature(new OlMultiLineString(geometry.coordinates).transform(EPSG_SYSTEM, this.#getProjection())));
          }
        }
      }
    } else if (picked?.geometry.type.endsWith("Polygon")) {
      const mask = getMask(picked as Feature<Polygon | MultiPolygon>);
      if (mask) {
        for (const f of mask.features) {
          const geom = f.geometry.type === "Polygon" ? new OlPolygon(f.geometry.coordinates) : new OlMultiPolygon(f.geometry.coordinates);

          this.#resultSource.addFeature(
            new OlFeature({
              isMask: !!f.properties?.isMask,
              geometry: geom.transform(EPSG_SYSTEM, this.#getProjection()),
            }),
          );
        }
      }
      if (this.#options.pickedResultStyle === "full-geometry-including-polygon-center-marker") {
        addMarker();
      }
    } else if (picked?.geometry.type === "LineString") {
      this.#resultSource.addFeature(new OlFeature(new OlLineString(picked.geometry.coordinates).transform(EPSG_SYSTEM, this.#getProjection())));
    } else if (picked?.geometry.type === "MultiLineString") {
      this.#resultSource.addFeature(new OlFeature(new OlMultiLineString(picked.geometry.coordinates).transform(EPSG_SYSTEM, this.#getProjection())));
    } else if (picked?.geometry.type.endsWith("Point")) {
      addMarker();
    }

    if (this.#options.showResultMarkers !== false) {
      for (const feature of markedFeatures ?? []) {
        if (feature.id === picked?.id || feature.place_type.includes("reverse")) {
          continue;
        }

        const marker = new OlFeature(new OlPoint(this.#transformPositionToCoordinate(feature.center)));
        marker.setId(feature.id);
        marker.setProperties({
          fuzzy: !!feature.matching_text,
          tooltip: feature.place_type[0] === "reverse" ? feature.place_name : feature.place_name.replace(/,.*/, ""),
        });
        this.#resultSource.addFeature(marker);

        this.#markers.set(feature, marker);
      }
    }
  }

  #setSelectedMarker(feature: Feature): void {
    this.#selectedMarker?.set("isSelected", false);
    this.#selectedMarker = undefined;

    if (this.#options.markerOnSelected !== false) {
      this.#selectedMarker = this.#markers.get(feature);
      this.#selectedMarker?.setProperties({ isSelected: true });
    }
  }

  #addResultLayer() {
    if (!this.#map) {
      return;
    }

    this.#resultSource = new VectorSource({});
    this.#resultLayer = new VectorLayer({
      updateWhileAnimating: true,
    });
    this.#resultLayer.setSource(this.#resultSource);
    this.#resultLayer.setStyle(this.#getFullGeometryStyle());

    this.#map.addLayer(this.#resultLayer);
  }

  #removeResultLayer() {
    if (!this.#map || !this.#resultLayer) {
      return;
    }

    this.#map.removeLayer(this.#resultLayer);
    this.#resultLayer = undefined;
  }

  #getProjection(): Projection | undefined {
    return getUserProjection() ?? this.#map?.getView().getProjection();
  }

  #transformPositionToCoordinate(position: Position): Coordinate {
    return fromLonLat(position, this.#getProjection());
  }

  #transformCoordinateToPosition(coordinate: Coordinate): Position {
    return toLonLat(coordinate, this.#getProjection()) as Position;
  }

  #getFullGeometryStyle() {
    const { fullGeometryStyle } = this.#options;
    if (fullGeometryStyle === true || fullGeometryStyle === undefined) return DEFAULT_GEOMETRY_STYLE(this.#options);
    if (fullGeometryStyle === false || fullGeometryStyle === null) return undefined;
    return fullGeometryStyle;
  }
}
