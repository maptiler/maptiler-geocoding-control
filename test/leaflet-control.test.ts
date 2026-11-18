/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { Map as LMap } from "leaflet";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GeocodingControl } from "../src/leaflet.public";

describe("LeafletGeocodingControl", () => {
  function createMapHelper() {
    const container = document.createElement("div");
    container.style.height = "400px";
    document.body.appendChild(container);
    const map = new LMap(container, { center: [0, 0], zoom: 2 });
    const control = new GeocodingControl();
    map.addControl(control);
    const element = container.querySelector("maptiler-geocoder")!;
    return {
      container,
      map,
      control,
      element,
    };
  }

  afterEach(() => {
    document.body.replaceChildren();
  });

  it("should support on, once, off and listens of the Leaflet Evented", () => {
    const { control, element } = createMapHelper();
    const onListener = vi.fn();
    const onceListener = vi.fn();
    const offListener = vi.fn();

    control.on("querychange", onListener);
    control.once("querychange", onceListener);
    control.on("querychange", offListener);
    control.off("querychange", offListener);

    expect(control.listens("querychange")).toBe(true);

    element.dispatchEvent(new CustomEvent("querychange", { detail: { query: "svitavy" } }));
    control.off("querychange", onListener);
    element.dispatchEvent(new CustomEvent("querychange", { detail: { query: "brno" } }));

    expect(onListener).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ type: "querychange", query: "svitavy", target: control }));
    expect(onceListener).toHaveBeenCalledOnce();
    expect(offListener).not.toHaveBeenCalled();
    expect(control.listens("querychange")).toBe(false);
  });
});
