/* eslint-disable @typescript-eslint/no-non-null-assertion */

import "./mock-webgl";

import { Map as SDKMap } from "@maptiler/sdk";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MaplibreglGeocodingControl, type MaplibreglGeocodingControlOptions } from "../src/maplibregl.public";

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

  it("should not call overridable methods from the constructor, before fields of subclasses are initialized", () => {
    class CustomControl extends MaplibreglGeocodingControl {
      #calls: string[] = [];

      override setOptions(options: MaplibreglGeocodingControlOptions) {
        this.#calls.push("setOptions");
        super.setOptions(options);
      }
    }

    const control = new CustomControl({ limit: 7 });

    expect(control.getOptions().limit).toBe(7);
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

  it("should support on, once, off and listens of the MapLibre GL JS Evented", async () => {
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
});
