/* eslint-disable @typescript-eslint/no-non-null-assertion */

import "./mock-webgl";

import { Map as SDKMap } from "@maptiler/sdk";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MaplibreglGeocodingControl, type MaplibreglGeocodingControlOptions } from "../src/maplibregl.public";
import { MaptilerGeocodingControl, type MaptilerGeocodingControlOptions } from "../src/maptilersdk.public";

const wait = (ms = 0) => new Promise((res) => setTimeout(res, ms));

describe("MaplibreglGeocodingControl", () => {
  function createMapHelper(controlOptions?: MaplibreglGeocodingControlOptions) {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const map = new SDKMap({
      container,
      style: {
        version: 8,
        sources: {},
        layers: [],
      },
    });
    const control = new MaplibreglGeocodingControl(controlOptions);
    map.addControl(control);
    const element = container.querySelector("maptiler-geocoder")!;
    return {
      container,
      map,
      control,
      element,
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  it("should instantiate the control", () => {
    expect(() => {
      new MaplibreglGeocodingControl();
    }).not.toThrow();
  });

  it("should move the element into the map DOM", () => {
    const { container } = createMapHelper();

    expect(container.querySelector("maptiler-geocoder")).not.toBeNull();
  });

  it("should propagate geocoder options into the geocoder component", () => {
    const { element } = createMapHelper({ limit: 10 });

    expect(element.limit).toBe(10);
  });

  it("should not propagate control-specific options into the geocoder component", () => {
    const { element } = createMapHelper({ flyToSelected: true });

    expect(element).not.toHaveProperty("flyToSelected");
  });

  it("should set value of geocoder input when setQuery is called", async () => {
    const { control, element } = createMapHelper({ limit: 10 });

    control.setQuery("svitavy");
    await wait();

    expect(element.shadowRoot!.querySelector("input")!.value).toBe("svitavy");
  });

  it("should focus the geocoder input when focus is called", async () => {
    const { control, element } = createMapHelper({ limit: 10 });
    await wait();

    control.focus();

    expect(document.activeElement!.localName).toBe("maptiler-geocoder");
    expect(element.shadowRoot!.activeElement!.localName).toBe("input");
  });

  it("should unfocus the geocoder input when blur is called", async () => {
    const { control, element } = createMapHelper({ limit: 10 });
    await wait();

    control.focus();
    control.blur();

    expect(document.activeElement!.localName).not.toBe("maptiler-geocoder");
    expect(element.shadowRoot!.activeElement).toBeNullable();
  });

  it("should forward DOM events from the geocoder component as Evented events", () => {
    const { control, element } = createMapHelper({ limit: 10 });

    const querychangeListener = vi.fn();
    const selectListener = vi.fn();
    const pickListener = vi.fn();
    const featureslistedListener = vi.fn();

    control.on("querychange", querychangeListener);
    control.on("select", selectListener);
    control.on("pick", pickListener);
    control.on("featureslisted", featureslistedListener);

    element.dispatchEvent(new CustomEvent("querychange", { detail: { query: "svitavy" } }));
    expect(querychangeListener).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ query: "svitavy" }));

    element.dispatchEvent(new CustomEvent("select", { detail: { feature: { name: "Svitavy" } } }));
    expect(selectListener).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ feature: { name: "Svitavy" } }));

    element.dispatchEvent(new CustomEvent("pick", { detail: { feature: { name: "Svitavy" } } }));
    expect(pickListener).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ feature: { name: "Svitavy" } }));

    element.dispatchEvent(new CustomEvent("featureslisted", { detail: { features: [] } }));
    expect(featureslistedListener).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ features: [] }));
  });
});

describe("MaptilerGeocodingControl", () => {
  function createMapHelper(controlOptions?: MaptilerGeocodingControlOptions) {
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
    const control = new MaptilerGeocodingControl(controlOptions);
    map.addControl(control);
    const element = container.querySelector("maptiler-geocoder")!;
    const getAdjustedUrl = () => {
      const url = new URL("https://api.maptiler.com/geocoding/svitavy.json");
      element.adjustUrl?.(url);
      return url;
    };
    return {
      container,
      map,
      control,
      element,
      getAdjustedUrl,
    };
  }

  afterEach(() => {
    document.body.replaceChildren();
  });

  it("should take the API key from the map", () => {
    const { control, element } = createMapHelper();

    expect(control.getOptions().apiKey).toBe("map-api-key");
    expect(element.apiKey).toBe("map-api-key");
  });

  it("should add session ID to the URL by default", () => {
    const { map, getAdjustedUrl } = createMapHelper();

    expect(getAdjustedUrl().searchParams.getAll("mtsid")).toEqual([map.getMaptilerSessionId()]);
  });

  it("should keep user's adjustUrl and session: false when API key comes from the map", () => {
    const adjustUrl = vi.fn((url: URL) => {
      url.searchParams.set("custom", "1");
    });
    const { getAdjustedUrl } = createMapHelper({ adjustUrl, session: false });

    const url = getAdjustedUrl();

    expect(adjustUrl).toHaveBeenCalledOnce();
    expect(url.searchParams.get("custom")).toBe("1");
    expect(url.searchParams.has("mtsid")).toBe(false);
  });

  it("should keep user's adjustUrl and session when unrelated options are set", () => {
    const adjustUrl = vi.fn();
    const { control, getAdjustedUrl } = createMapHelper({ adjustUrl, session: false });

    control.setReverseMode(true);
    control.setOptions({ limit: 3 });
    const url = getAdjustedUrl();

    expect(adjustUrl).toHaveBeenCalledOnce();
    expect(url.searchParams.has("mtsid")).toBe(false);
  });

  it("should apply session option changed after creation", () => {
    const { control, map, getAdjustedUrl } = createMapHelper({ session: false });

    control.setOptions({ session: true });

    expect(getAdjustedUrl().searchParams.getAll("mtsid")).toEqual([map.getMaptilerSessionId()]);
  });

  it("should return user's adjustUrl from getOptions and not duplicate session ID when options are re-applied", () => {
    const adjustUrl = vi.fn();
    const { control, getAdjustedUrl } = createMapHelper({ adjustUrl });

    expect(control.getOptions().adjustUrl).toBe(adjustUrl);

    control.setOptions(control.getOptions());
    const url = getAdjustedUrl();

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
    const { control, getAdjustedUrl } = createMapHelper({ adjustUrl, limit: 3 });

    control.setOptions({ adjustUrl: undefined, limit: undefined });
    const url = getAdjustedUrl();

    expect(control.getOptions()).toHaveProperty("adjustUrl", undefined);
    expect(control.getOptions()).toHaveProperty("limit", undefined);
    expect(adjustUrl).not.toHaveBeenCalled();
    expect(url.searchParams.getAll("mtsid")).toHaveLength(1);
  });
});
