/* eslint-disable @typescript-eslint/no-non-null-assertion */

import "./mock-webgl";

import { Marker, MarkerMLGL, Map as SDKMap } from "@maptiler/sdk";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GeocodingControl, type GeocodingControlOptions } from "../src/maptilersdk.public";
import type { Feature } from "../src/types";

const feature: Feature = {
  type: "Feature",
  id: "place.1",
  text: "Svitavy",
  place_name: "Svitavy, Pardubice, Czechia",
  place_type: ["place"],
  place_type_name: ["town"],
  center: [16.468, 49.756],
  bbox: [16.42, 49.72, 16.51, 49.79],
  geometry: { type: "Point", coordinates: [16.468, 49.756] },
  properties: {},
};

describe("MaptilerGeocodingControl", () => {
  function createMapHelper(controlOptions?: GeocodingControlOptions) {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const map = new SDKMap({
      container,
      apiKey: "map-api-key",
      style: {
        version: 8,
        sources: {},
        layers: [],
      },
    });
    const control = new GeocodingControl(controlOptions);
    map.addControl(control);
    const element = container.querySelector("maptiler-geocoder")!;
    return {
      container,
      map,
      control,
      element,
    };
  }

  /** Lists the feature as a search result and returns the result marker, taken from the `markerclick` event */
  function listFeatureAndGetMarker({ container, control, element }: ReturnType<typeof createMapHelper>) {
    let marker: Marker | undefined;
    control.on("markerclick", (event) => {
      marker = event.marker;
    });

    element.dispatchEvent(new CustomEvent("featureslisted", { detail: { features: [feature] } }));
    container.querySelector(".maplibregl-marker")!.dispatchEvent(new MouseEvent("click"));

    return marker;
  }

  afterEach(() => {
    document.body.replaceChildren();
  });

  describe("API key, session and adjustUrl", () => {
    /** Applies the `adjustUrl` passed to the geocoder element to a geocoding URL */
    function getAdjustedUrl({ element }: ReturnType<typeof createMapHelper>) {
      const url = new URL("https://api.maptiler.com/geocoding/svitavy.json");
      element.adjustUrl?.(url);
      return url;
    }

    it("should take the API key from the map", () => {
      const { control, element } = createMapHelper();

      expect(control.getOptions().apiKey).toBe("map-api-key");
      expect(element.apiKey).toBe("map-api-key");
    });

    it("should add session ID to the URL by default", () => {
      const helper = createMapHelper();

      expect(getAdjustedUrl(helper).searchParams.getAll("mtsid")).toEqual([helper.map.getMaptilerSessionId()]);
    });

    it("should keep user's adjustUrl and session: false when API key comes from the map", () => {
      const adjustUrl = vi.fn((url: URL) => {
        url.searchParams.set("custom", "1");
      });
      const helper = createMapHelper({ adjustUrl, session: false });

      const url = getAdjustedUrl(helper);

      expect(adjustUrl).toHaveBeenCalledOnce();
      expect(url.searchParams.get("custom")).toBe("1");
      expect(url.searchParams.has("mtsid")).toBe(false);
    });

    it("should keep user's adjustUrl and session when unrelated options are set", () => {
      const adjustUrl = vi.fn();
      const helper = createMapHelper({ adjustUrl, session: false });

      helper.control.setReverseMode(true);
      helper.control.setOptions({ limit: 3 });
      const url = getAdjustedUrl(helper);

      expect(adjustUrl).toHaveBeenCalledOnce();
      expect(url.searchParams.has("mtsid")).toBe(false);
    });

    it("should apply session option changed after creation", () => {
      const helper = createMapHelper({ session: false });

      helper.control.setOptions({ session: true });

      expect(getAdjustedUrl(helper).searchParams.getAll("mtsid")).toEqual([helper.map.getMaptilerSessionId()]);
    });

    it("should return user's adjustUrl from getOptions and not duplicate session ID when options are re-applied", () => {
      const adjustUrl = vi.fn();
      const helper = createMapHelper({ adjustUrl });

      expect(helper.control.getOptions().adjustUrl).toBe(adjustUrl);

      helper.control.setOptions(helper.control.getOptions());
      const url = getAdjustedUrl(helper);

      expect(adjustUrl).toHaveBeenCalledOnce();
      expect(url.searchParams.getAll("mtsid")).toHaveLength(1);
    });

    it("should not return adjustUrl from getOptions when it was never set, like other options", () => {
      const { control } = createMapHelper();

      expect(control.getOptions()).not.toHaveProperty("adjustUrl");
      expect(control.getOptions()).not.toHaveProperty("limit");
    });

    it("should unset user's adjustUrl like other options when explicitly set to undefined", () => {
      const adjustUrl = vi.fn();
      const helper = createMapHelper({ adjustUrl, limit: 3 });

      helper.control.setOptions({ adjustUrl: undefined, limit: undefined });
      const url = getAdjustedUrl(helper);

      expect(helper.control.getOptions()).toHaveProperty("adjustUrl", undefined);
      expect(helper.control.getOptions()).toHaveProperty("limit", undefined);
      expect(adjustUrl).not.toHaveBeenCalled();
      expect(url.searchParams.getAll("mtsid")).toHaveLength(1);
    });
  });

  it("should support on, once, off and listens of the MapTiler SDK Evented", async () => {
    const { control, element } = createMapHelper();
    const onListener = vi.fn();
    const onceListener = vi.fn();
    const offListener = vi.fn();

    const subscription = control.on("querychange", onListener);
    control.once("querychange", onceListener);
    control.on("querychange", offListener);
    control.off("querychange", offListener);
    const oncePromise = control.once("querychange");

    expect(control.listens("querychange")).toBe(true);

    element.dispatchEvent(new CustomEvent("querychange", { detail: { query: "svitavy" } }));
    await expect(oncePromise).resolves.toEqual(expect.objectContaining({ type: "querychange", query: "svitavy", target: control }));

    subscription.unsubscribe();
    element.dispatchEvent(new CustomEvent("querychange", { detail: { query: "brno" } }));

    expect(onListener).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ type: "querychange", query: "svitavy", target: control }));
    expect(onceListener).toHaveBeenCalledOnce();
    expect(offListener).not.toHaveBeenCalled();
    expect(control.listens("querychange")).toBeFalsy();
  });

  it("should create result markers with the MapTiler SDK Marker and add them with map.addMarker", () => {
    const helper = createMapHelper();
    const addMarker = vi.spyOn(helper.map, "addMarker");

    const marker = listFeatureAndGetMarker(helper);

    expect(marker).toBeInstanceOf(Marker);
    expect(addMarker).toHaveBeenCalledExactlyOnceWith(marker);
  });

  it("should create result markers using MapTiler SDK Marker options", () => {
    const marker = listFeatureAndGetMarker(createMapHelper({ showResultMarkers: { outerColor: "#ff0000" } }));

    expect(marker).toBeInstanceOf(Marker);
    expect(marker!.options.outerColor).toBe("#ff0000");
  });

  it("should pass the MapTiler SDK map to the result marker function", () => {
    let mapOfFunction: SDKMap | undefined;
    const helper = createMapHelper({
      showResultMarkers: (map, feature) => {
        mapOfFunction = map;
        const marker = new Marker({ outerColor: "#00ff00" }).setLngLat(feature.center);
        map.addMarker(marker);
        return marker;
      },
    });

    const marker = listFeatureAndGetMarker(helper);

    expect(mapOfFunction).toBe(helper.map);
    expect(marker!.options.outerColor).toBe("#00ff00");
  });

  it("should create the picked result marker using MapTiler SDK Marker options", () => {
    const { container, element } = createMapHelper({ marker: { outerColor: "#ff0000" }, showResultMarkers: false });

    element.dispatchEvent(new CustomEvent("pick", { detail: { feature } }));

    const markerElements = container.querySelectorAll(".maplibregl-marker");
    expect(markerElements).toHaveLength(1);
    expect(markerElements[0]!.outerHTML).toMatch(/#ff0000|rgb\(255, 0, 0\)/i);
  });

  it("should accept only MapTiler SDK Marker options and markers (type check)", () => {
    // @ts-expect-error `color` is an option of the MapLibre GL JS Marker, the MapTiler SDK Marker has `outerColor` etc.
    const maplibreColor: GeocodingControlOptions = { marker: { color: "#ff0000" } };
    // @ts-expect-error `scale` of the MapTiler SDK Marker is `[x, y]`
    const numericScale: GeocodingControlOptions = { marker: { scale: 2 } };
    // @ts-expect-error the function has to return the MapTiler SDK Marker
    const maplibreMarker: GeocodingControlOptions = { showResultMarkers: () => new MarkerMLGL() };
    const sdkOptions: GeocodingControlOptions = {
      marker: { outerColor: "#ff0000", scale: [2, 2] },
      showResultMarkers: (_map, feature) => new Marker().setLngLat(feature.center),
    };

    expect([maplibreColor, numericScale, maplibreMarker, sdkOptions]).toHaveLength(4);
  });
});
