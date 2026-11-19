/* eslint-disable @typescript-eslint/no-non-null-assertion */

import type OlFeature from "ol/Feature.js";
import VectorLayer from "ol/layer/Vector.js";
import OlMap from "ol/Map.js";
import type VectorSource from "ol/source/Vector.js";
import View from "ol/View.js";
import { afterEach, describe, expect, it } from "vitest";
import { GeocodingControl } from "../src/openlayers.public";
import type { Feature } from "../src/types";

const polygonFeature: Feature = {
  type: "Feature",
  id: "municipality.1",
  text: "Svitavy",
  place_name: "Svitavy, Pardubice, Czechia",
  place_type: ["municipality"],
  place_type_name: ["town"],
  center: [16.468, 49.756],
  bbox: [16.42, 49.72, 16.51, 49.79],
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [16.42, 49.72],
        [16.51, 49.72],
        [16.51, 49.79],
        [16.42, 49.79],
        [16.42, 49.72],
      ],
    ],
  },
  properties: {},
};

const pointFeature: Feature = {
  type: "Feature",
  id: "poi.2",
  text: "Svitavy railway station",
  place_name: "Svitavy railway station, Svitavy, Czechia",
  place_type: ["poi"],
  place_type_name: ["railway station"],
  center: [16.476, 49.762],
  bbox: [16.476, 49.762, 16.476, 49.762],
  geometry: { type: "Point", coordinates: [16.476, 49.762] },
  properties: {},
};

describe("OpenLayersGeocodingControl", () => {
  function createMapHelper() {
    const container = document.createElement("div");
    container.style.width = "400px";
    container.style.height = "400px";
    document.body.appendChild(container);
    const map = new OlMap({ target: container, view: new View({ center: [0, 0], zoom: 2 }) });
    const control = new GeocodingControl();
    map.addControl(control);
    const element = container.querySelector("maptiler-geocoder")!;
    const getResultFeatures = () => {
      const layer = map
        .getLayers()
        .getArray()
        .find((layer) => layer instanceof VectorLayer)!;
      return (layer as VectorLayer<VectorSource<OlFeature>>).getSource()!.getFeatures();
    };
    return {
      container,
      map,
      control,
      element,
      getResultFeatures,
    };
  }

  afterEach(() => {
    document.body.replaceChildren();
  });

  it("should remove the geometry of the previously picked result", () => {
    const { element, getResultFeatures } = createMapHelper();

    element.dispatchEvent(new CustomEvent("pick", { detail: { feature: polygonFeature } }));
    expect(getResultFeatures().length).toBeGreaterThan(0);

    element.dispatchEvent(new CustomEvent("pick", { detail: { feature: pointFeature } }));
    const features = getResultFeatures();

    expect(features).toHaveLength(1);
    expect(features[0]!.getGeometry()!.getType()).toBe("Point");
  });
});
