/* eslint-disable
  @typescript-eslint/no-non-null-assertion,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/unbound-method,
*/

vi.mock("../src/utils/proximity", () => ({
  getProximity: () => Promise.resolve(undefined),
}));

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import "../src";

const wait = (ms = 0) => new Promise((res) => setTimeout(res, ms));

const features = [
  {
    type: "Feature",
    properties: {
      ref: "osm:r436057",
      country_code: "cz",
      wikidata: "Q110206380",
      kind: "admin_area",
    },
    geometry: {
      type: "Point",
      coordinates: [16.469106609414666, 49.75598483456225],
    },
    bbox: [16.465552747249603, 49.754559553925084, 16.473205089569092, 49.75747784699889],
    center: [16.469106609414666, 49.75598483456225],
    place_name: "Svitavy-město, Svitavy, Česko",
    place_type: ["locality"],
    relevance: 0.96,
    id: "locality.11077",
  },
  {
    type: "Feature",
    properties: {
      ref: "osm:r430594",
      country_code: "cz",
      wikidata: "Q110206383",
      kind: "admin_area",
    },
    geometry: {
      type: "Point",
      coordinates: [16.465495476625506, 49.76117914674463],
    },
    bbox: [16.428668349981308, 49.75038855709432, 16.507942378520966, 49.77617713549572],
    center: [16.465495476625506, 49.76117914674463],
    place_name: "Svitavy-předměstí, Svitavy, Česko",
    place_type: ["locality"],
    relevance: 0.96,
    id: "locality.15996",
  },
  {
    type: "Feature",
    properties: {
      ref: "osm:r434306",
      country_code: "cz",
      wikidata: "Q110699144",
      kind: "admin_area",
    },
    geometry: {
      type: "Point",
      coordinates: [14.62416868785067, 50.73106309665621],
    },
    bbox: [14.607590585947039, 50.72036776932437, 14.64605715125799, 50.744104683541444],
    center: [14.62416868785067, 50.73106309665621],
    place_name: "Svitava, Cvikov, Česko",
    place_type: ["locality"],
    relevance: 0.891429,
    id: "locality.3801",
    place_type_name: ["katastrální území"],
  },
  {
    type: "Feature",
    properties: {
      ref: "osm:r435261",
      country_code: "cz",
      wikidata: "Q110208405",
      kind: "admin_area",
      place_type_name: ["katastrální území"],
    },
    geometry: {
      type: "Point",
      coordinates: [16.53300641661326, 49.70491448400361],
    },
    bbox: [16.493744775652885, 49.67049579549808, 16.577192656695843, 49.72413044651795],
    center: [16.53300641661326, 49.70491448400361],
    place_name: "Sklené u Svitav, Sklené, Česko",
    place_type: ["locality"],
    relevance: 0.356571,
    id: "locality.8864",
    text: "Sklené u Svitav",
    place_type_name: ["katastrální území"],
  },
  {
    type: "Feature",
    properties: {
      ref: "osm:r428919",
      country_code: "cz",
      wikidata: "Q110206476",
      kind: "admin_area",
      place_type_name: ["katastrální území"],
    },
    geometry: {
      type: "Point",
      coordinates: [16.541825964537338, 49.79862593521514],
    },
    bbox: [16.504300273954872, 49.77947603194767, 16.573985069990158, 49.82171244263241],
    center: [16.541825964537338, 49.79862593521514],
    place_name: "Dětřichov u Svitav, Dětřichov, Česko",
    place_type: ["locality"],
    relevance: 0.356571,
    id: "locality.12692",
    place_type_name: ["katastrální území"],
  },
];

describe("standalone control", () => {
  const fetchMock = vi.fn(() => {
    return Promise.resolve({
      ok: true,
      text: () => Promise.resolve(""),
      json: () =>
        Promise.resolve({
          type: "FeatureCollection",
          features,
          query: ["svitavy"],
        }),
    });
  });

  beforeAll(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it("should be registered as a webcomponent", () => {
    expect(customElements.get("maptiler-geocoder")).toBeTruthy();
  });

  it("should have custom methods", () => {
    const element = document.createElement("maptiler-geocoder");

    expect(element.setOptions).toBeTruthy();
    expect(element.setQuery).toBeTruthy();
    expect(element.submitQuery).toBeTruthy();
    expect(element.clearList).toBeTruthy();
  });

  it("should focus input element when focus method called", async () => {
    const element = document.createElement("maptiler-geocoder");
    document.body.append(element as Node);
    await wait();

    element.focus();
    expect(document.activeElement?.localName).toBe("maptiler-geocoder");
    expect(element.shadowRoot!.activeElement?.localName).toBe("input");
  });

  it("should call API when submitted programmatically", async () => {
    vi.stubGlobal("fetch", fetchMock);

    const element = document.createElement("maptiler-geocoder");

    element.submitQuery("svitavy");
    await wait();

    expect(fetch).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]).toEqual([expect.stringContaining("svitavy"), expect.any(Object)]);
  });

  it("should call API when submitted from input element", async () => {
    const element = document.createElement("maptiler-geocoder");
    document.body.append(element as Node);
    await wait();

    element.shadowRoot!.querySelector("input")!.value = "svitavy";
    element.shadowRoot!.querySelector("input")!.dispatchEvent(new Event("input"));
    element.shadowRoot!.querySelector("form")!.dispatchEvent(new Event("submit"));
    await wait();

    expect(fetch).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]).toEqual([expect.stringContaining("svitavy"), expect.any(Object)]);
  });

  it("should call API after debounce when input value changes", async () => {
    const element = document.createElement("maptiler-geocoder");
    document.body.append(element as Node);
    await wait();

    element.shadowRoot!.querySelector("input")!.value = "svitavy";
    element.shadowRoot!.querySelector("input")!.dispatchEvent(new Event("input"));

    expect(fetch).not.toHaveBeenCalled();

    await wait(200); // debounce

    expect(fetch).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]).toEqual([expect.stringContaining("svitavy"), expect.any(Object)]);
  });

  it("should call API after debounce when query changes programmatically", async () => {
    const element = document.createElement("maptiler-geocoder");
    document.body.append(element as Node);
    await wait();

    element.setQuery("svitavy");

    expect(fetch).not.toHaveBeenCalled();

    await wait(200); // debounce

    expect(fetch).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]).toEqual([expect.stringContaining("svitavy"), expect.any(Object)]);
  });

  it("should not call API when input value changes if showResultsWhileTyping is false", async () => {
    const element = document.createElement("maptiler-geocoder");
    element.showResultsWhileTyping = false;
    document.body.append(element as Node);
    await wait();

    element.shadowRoot!.querySelector("input")!.value = "svitavy";
    element.shadowRoot!.querySelector("input")!.dispatchEvent(new Event("input"));

    expect(fetch).not.toHaveBeenCalled();

    await wait(200 + 50); // debounce + extra time

    expect(fetch).not.toHaveBeenCalled();
  });

  it("should not call API when query changes programmatically if showResultsWhileTyping is false", async () => {
    const element = document.createElement("maptiler-geocoder");
    element.showResultsWhileTyping = false;
    document.body.append(element as Node);
    await wait();

    element.setQuery("svitavy");

    expect(fetch).not.toHaveBeenCalled();

    await wait(200 + 50); // debounce + extra time

    expect(fetch).not.toHaveBeenCalled();
  });

  it("should dispatch reversetoggle event when reverse button is clicked", async () => {
    const listener = vi.fn();
    const element = document.createElement("maptiler-geocoder");
    element.enableReverse = "button";
    element.addEventListener("reversetoggle", listener);
    document.body.append(element as Node);
    await wait();

    element.shadowRoot!.querySelector("maptiler-geocode-reverse-geocoding-icon")!.parentElement!.dispatchEvent(new Event("click"));
    await wait();

    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ detail: { reverse: true } }));

    element.shadowRoot!.querySelector("maptiler-geocode-reverse-geocoding-icon")!.parentElement!.dispatchEvent(new Event("click"));
    await wait();

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ detail: { reverse: false } }));
  });

  it("should dispatch querychange event when query changes programmatically", async () => {
    const listener = vi.fn();
    const element = document.createElement("maptiler-geocoder");
    element.addEventListener("querychange", listener);
    document.body.append(element as Node);
    await wait();

    element.setQuery("svitavy");

    expect(listener).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ detail: { query: "svitavy", reverseCoords: false } }));
  });

  it("should dispatch querychange event when query changes by user", async () => {
    const listener = vi.fn();
    const element = document.createElement("maptiler-geocoder");
    element.addEventListener("querychange", listener);
    document.body.append(element as Node);
    await wait();

    element.shadowRoot!.querySelector("input")!.value = "svitavy";
    element.shadowRoot!.querySelector("input")!.dispatchEvent(new Event("input"));

    expect(listener).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ detail: { query: "svitavy", reverseCoords: false } }));
  });

  it("should dispatch queryclear event when clear button is clicked", async () => {
    const listener = vi.fn();
    const element = document.createElement("maptiler-geocoder");
    element.addEventListener("queryclear", listener);
    document.body.append(element as Node);
    await wait();

    element.shadowRoot!.querySelector("maptiler-geocode-clear-icon")!.parentElement!.dispatchEvent(new Event("click"));

    expect(listener).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ detail: null }));
  });

  it("should dispatch request event when API request is dispatched", async () => {
    const listener = vi.fn();
    const element = document.createElement("maptiler-geocoder");
    element.addEventListener("request", listener);
    document.body.append(element as Node);
    await wait();

    element.submitQuery("svitavy");
    await wait();

    expect(listener).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ detail: { urlObj: expect.any(URL) } }));
  });

  it("should dispatch response event when API request finishes", async () => {
    const listener = vi.fn();
    const element = document.createElement("maptiler-geocoder");
    element.addEventListener("response", listener);
    document.body.append(element as Node);
    await wait();

    element.submitQuery("svitavy");
    await wait();

    expect(listener).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ detail: { featureCollection: expect.any(Object), url: expect.any(String) } }));
  });

  it("should dispatch select event when first feature is selected automatically", async () => {
    const listener = vi.fn();
    const element = document.createElement("maptiler-geocoder");
    element.addEventListener("select", listener);
    document.body.append(element as Node);
    await wait();

    element.setQuery("svitavy");
    await wait(200); // debounce

    expect(listener).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ detail: { feature: features[0] } }));
  });

  it("should dispatch select event when a feature is selected with mouse", async () => {
    const listener = vi.fn();
    const element = document.createElement("maptiler-geocoder");
    element.addEventListener("select", listener);
    document.body.append(element as Node);
    await wait();

    element.setQuery("svitavy");
    await wait(200); // debounce

    element.shadowRoot!.querySelector("maptiler-geocoder-feature-item:nth-child(3)")!.dispatchEvent(new Event("pointerenter"));
    await wait();

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ detail: { feature: features[2] } }));
  });

  it("should dispatch select event when a feature is selected with keyboard", async () => {
    const listener = vi.fn();
    const element = document.createElement("maptiler-geocoder");
    element.addEventListener("select", listener);
    document.body.append(element as Node);
    await wait();

    element.setQuery("svitavy");
    await wait(200); // debounce

    element.shadowRoot!.querySelector("input")!.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
    await wait();

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ detail: { feature: features[1] } }));
  });

  it("should dispatch pick event when a feature is picked with mouse", async () => {
    const listener = vi.fn();
    const element = document.createElement("maptiler-geocoder");
    element.addEventListener("pick", listener);
    document.body.append(element as Node);
    await wait();

    element.setQuery("svitavy");
    await wait(200); // debounce

    element.shadowRoot!.querySelector("maptiler-geocoder-feature-item:nth-child(3)")!.dispatchEvent(new Event("select"));
    await wait();

    expect(listener).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ detail: { feature: features[2] } }));
  });

  it("should dispatch pick event when a feature is picked with keyboard", async () => {
    const listener = vi.fn();
    const element = document.createElement("maptiler-geocoder");
    element.addEventListener("pick", listener);
    document.body.append(element as Node);
    await wait();

    element.setQuery("svitavy");
    await wait(200); // debounce

    element.shadowRoot!.querySelector("input")!.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
    element.shadowRoot!.querySelector("form")!.dispatchEvent(new Event("submit"));
    await wait();

    expect(listener).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ detail: { feature: features[1] } }));
  });

  it("should dispatch featuresshow event when list of features is visible in DOM", async () => {
    const listener = vi.fn();
    const element = document.createElement("maptiler-geocoder");
    element.addEventListener("featuresshow", listener);
    document.body.append(element as Node);
    await wait();

    element.setQuery("svitavy");
    await wait(200); // debounce

    expect(listener).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ detail: null }));
    expect(element.shadowRoot!.querySelectorAll("maptiler-geocoder-feature-item").length).not.toBe(0);
  });

  it("should dispatch featureshide event when list of features is removed from DOM", async () => {
    const listener = vi.fn();
    const element = document.createElement("maptiler-geocoder");
    element.addEventListener("featureshide", listener);
    document.body.append(element as Node);
    await wait();

    element.setQuery("svitavy");
    await wait(200); // debounce

    element.clearList();
    await wait();

    expect(listener).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ detail: null }));
    expect(element.shadowRoot!.querySelectorAll("maptiler-geocoder-feature-item").length).toBe(0);
  });

  it("should dispatch featureslisted event when list of features is loaded from API", async () => {
    const listener = vi.fn();
    const element = document.createElement("maptiler-geocoder");
    element.addEventListener("featureslisted", listener);
    document.body.append(element as Node);
    await wait();

    element.setQuery("svitavy");
    await wait(200); // debounce

    expect(listener).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ detail: { features, external: true } }));
  });

  it("should dispatch featuresclear event when list of features is forgotten", async () => {
    const listener = vi.fn();
    const element = document.createElement("maptiler-geocoder");
    element.addEventListener("featuresclear", listener);
    document.body.append(element as Node);
    await wait();

    element.setQuery("svitavy");
    await wait(200); // debounce

    element.clearList();
    await wait();

    expect(listener).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ detail: null }));
  });

  it("should dispatch focusin event when input is focused", async () => {
    const listener = vi.fn();
    const element = document.createElement("maptiler-geocoder");
    element.addEventListener("focusin", listener);
    document.body.append(element as Node);
    await wait();

    element.focus();

    expect(listener).toHaveBeenCalledExactlyOnceWith(expect.any(FocusEvent));
  });

  it("should dispatch focusout event when input loses focus", async () => {
    const listener = vi.fn();
    const element = document.createElement("maptiler-geocoder");
    element.addEventListener("focusout", listener);
    document.body.append(element as Node);
    await wait();

    element.focus();
    document.body.focus();

    expect(listener).toHaveBeenCalledExactlyOnceWith(expect.any(FocusEvent));
  });
});
