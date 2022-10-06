<script type="ts">
  import type { FitBoundsOptions, FlyToOptions } from "maplibre-gl";
  import type MapLibreGL from "maplibre-gl";
  import { createEventDispatcher, onMount } from "svelte";
  import ClearIcon from "./ClearIcon.svelte";
  import LoadingIcon from "./LoadingIcon.svelte";
  import MarkerIcon from "./MarkerIcon.svelte";
  import SearchIcon from "./SearchIcon.svelte";
  import type { Feature, FeatureCollection } from "./types";

  let className: string | undefined;

  export { className as class };

  export let maplibregl: typeof MapLibreGL = undefined;

  export let map: maplibregl.Map;

  export let apiKey: string;

  export let debounceSearch = 200;

  export let placeholder = "Search";

  export let errorMessage = "Searching failed";

  export let proximity: [number, number] = undefined;

  export let bbox: [number, number, number, number] = undefined;

  export let trackProximity = true;

  export let minLength = 2;

  export let language = navigator.language.replace(/-.*/, "");

  export let showResultsWhileTyping = true;

  export let marker: boolean | maplibregl.MarkerOptions = true;

  export let showResultMarkers: boolean | maplibregl.MarkerOptions = true;

  export let zoom = 16;

  export let flyTo: boolean | (FlyToOptions & FitBoundsOptions) = true;

  export let collapsed = false;

  export let clearOnBlur = false;

  export let filter: (feature: Feature) => boolean = () => true;

  // export let limit = 5;

  // export let autocomplete = true;

  // export let fuzzy = true;

  onMount(() => {
    if (!trackProximity) {
      return;
    }

    function handleMoveEnd() {
      let c: maplibregl.LngLat;

      proximity =
        map.getZoom() > 9
          ? [(c = map.getCenter().wrap()).lng, c.lat]
          : undefined;
    }

    map.on("moveend", handleMoveEnd);

    return () => {
      map.off("moveend", handleMoveEnd);
    };
  });

  let focused = false;

  let searchValue = "";

  let listFeatures: Feature[] = [];

  let markedFeatures: Feature[] = [];

  let picked: Feature | undefined;

  let selectedMarker: maplibregl.Marker;

  let lastSearchUrl = "";

  let input: HTMLInputElement;

  $: if (picked && flyTo) {
    if (
      !picked.bbox ||
      (picked.bbox[0] === picked.bbox[2] && picked.bbox[1] === picked.bbox[3])
    ) {
      map.flyTo({ center: picked.center, zoom });
    } else {
      map.fitBounds(picked.bbox, flyTo === true ? {} : flyTo);
    }

    listFeatures = [];
    markedFeatures = [];
    index = -1;
  }

  const markers: maplibregl.Marker[] = [];

  $: markersBlock: {
    if (!maplibregl) {
      break markersBlock;
    }

    for (const marker of markers) {
      marker.remove();
    }

    markers.length = 0;

    for (const feature of picked
      ? [...markedFeatures, picked]
      : markedFeatures) {
      let m: maplibregl.Marker;

      if (feature === picked && typeof marker === "object") {
        m = new maplibregl.Marker(marker);
      } else if (feature !== picked && typeof showResultMarkers === "object") {
        m = new maplibregl.Marker(showResultMarkers);
      } else {
        const element = document.createElement("div");

        new MarkerIcon({ props: { inMap: true }, target: element });

        m = new maplibregl.Marker({ element });
      }

      markers.push(m.setLngLat(feature.center).addTo(map));
    }
  }

  $: if (!searchValue) {
    picked = undefined;
    listFeatures = [];
    error = undefined;

    if (showResultMarkers) {
      markedFeatures = listFeatures;
    }
  }

  let error: unknown;

  function handleOnSubmit() {
    if (index > -1) {
      picked = listFeatures[index];
      searchValue = picked.place_name.replace(/,.*/, "");
      error = undefined;
      markedFeatures = [];
      index = -1;
    } else if (searchValue) {
      search(searchValue)
        .then(() => {
          markedFeatures = listFeatures;

          zoomToResults();
        })
        .catch((err) => (error = err));
    }
  }

  const dispatch = createEventDispatcher<{
    select: Feature;
    pick: Feature;
    optionsVisibilityChange: boolean;
    featuresListed: Feature[];
    featuresMarked: Feature[];
    response: { url: string; featureCollection: FeatureCollection };
  }>();

  let cachedFeatures: Feature[] = [];

  let abortController: AbortController;

  async function search(searchValue: string) {
    error = undefined;

    const sp = new URLSearchParams();

    sp.set("key", apiKey);

    if (language) {
      sp.set("language", String(language));
    }

    if (bbox) {
      sp.set("bbox", bbox.join(","));
    }

    if (proximity) {
      sp.set("proximity", proximity.join(","));
    }

    // sp.set("limit", String(limit));

    // sp.set("autocomplete", String(autocomplete));

    // sp.set("fuzzyMatch", String(fuzzy));

    const url =
      "https://api.maptiler.com/geocoding/" +
      encodeURIComponent(searchValue) +
      ".json?" +
      sp.toString();

    if (url === lastSearchUrl) {
      listFeatures = cachedFeatures;

      return;
    }

    lastSearchUrl = url;

    abortController?.abort();

    abortController = new AbortController();

    let res: Response;

    try {
      res = await fetch(url, { signal: abortController.signal }).finally(() => {
        abortController = undefined;
      });
    } catch (e) {
      if (typeof e === "object" && e.name === "AbortError") {
        return;
      }
    }

    if (!res.ok) {
      throw new Error();
    }

    const featureCollection: FeatureCollection = await res.json();

    dispatch("response", { url, featureCollection });

    listFeatures = featureCollection.features.filter(filter);

    cachedFeatures = listFeatures;
  }

  function zoomToResults() {
    if (!markedFeatures.length || !flyTo) {
      return;
    }

    const bbox: [number, number, number, number] = [180, 90, -180, -90];

    for (const feature of markedFeatures) {
      bbox[0] = Math.min(bbox[0], feature.bbox?.[0] ?? feature.center[0]);
      bbox[1] = Math.min(bbox[1], feature.bbox?.[1] ?? feature.center[1]);
      bbox[2] = Math.max(bbox[2], feature.bbox?.[2] ?? feature.center[0]);
      bbox[3] = Math.max(bbox[3], feature.bbox?.[3] ?? feature.center[1]);
    }

    if (markedFeatures.length > 0) {
      if (bbox[0] === bbox[2] && bbox[1] === bbox[3]) {
        map.flyTo({
          ...(flyTo === true ? {} : flyTo),
          center: picked.center,
          zoom,
        });
      } else {
        map.fitBounds(bbox, { ...(flyTo === true ? {} : flyTo), padding: 50 });
      }
    }
  }

  // highlight selected marker
  $: {
    if (selectedMarker) {
      selectedMarker.getElement().classList.toggle("marker-selected", false);
    }

    selectedMarker = index > -1 ? markers[index] : undefined;

    selectedMarker?.getElement().classList.toggle("marker-selected", true);
  }

  let focusedDelayed: boolean;

  // close dropdown in the next cycle so that the selected item event has the chance to fire
  $: setTimeout(() => {
    focusedDelayed = focused;

    if (clearOnBlur && !focused) {
      searchValue = "";
    }
  });

  let index = -1;

  function handleKeyDown(e: KeyboardEvent) {
    let dir = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;

    if (dir) {
      if (index === -1 && dir === -1) {
        index = listFeatures.length;
      }

      index += dir;

      if (index >= listFeatures.length) {
        index = -1;
      }

      e.preventDefault();
    } else if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
      index = -1;
    }
  }

  $: {
    searchValue; // clear selection on edit

    index = -1;
  }

  let searchTimeoutRef: number;

  function handleInput() {
    if (showResultsWhileTyping && searchValue.length > minLength) {
      if (searchTimeoutRef) {
        clearTimeout(searchTimeoutRef);
      }

      const sv = searchValue;

      searchTimeoutRef = window.setTimeout(() => {
        search(sv).catch((err) => (error = err));
      }, debounceSearch);
    } else {
      listFeatures = [];
      error = undefined;
    }
  }

  $: showList = focusedDelayed && listFeatures.length > 0;

  $: selected = listFeatures[index];

  $: dispatch("select", selected);

  $: dispatch("pick", picked);

  $: dispatch("optionsVisibilityChange", showList);

  $: dispatch("featuresListed", listFeatures);

  $: dispatch("featuresMarked", markedFeatures);

  export function focus() {
    input.focus();
  }

  export function blur() {
    input.blur();
  }
</script>

<form
  tabindex="0"
  on:submit|preventDefault={handleOnSubmit}
  on:focus={() => console.log("FOCUS")}
  class:can-collapse={collapsed && searchValue === ""}
  class={className}
>
  <div class="input-group">
    <button type="button" on:click={() => input.focus()}>
      <SearchIcon />
    </button>

    <input
      bind:this={input}
      bind:value={searchValue}
      on:focus={() => (focused = true)}
      on:blur={() => (focused = false)}
      on:keydown={handleKeyDown}
      on:input={handleInput}
      {placeholder}
      aria-label={placeholder}
    />

    <div class="clear-button-container">
      <button
        type="button"
        on:click={() => {
          searchValue = "";
          input.focus();
        }}
        class:displayable={searchValue !== ""}
      >
        <ClearIcon />
      </button>

      {#if abortController}
        <LoadingIcon />
      {/if}
    </div>

    <slot />
  </div>

  {#if error}
    <div class="error">{errorMessage}</div>
  {:else if showList}
    <ul on:mouseout={() => (index = -1)} on:blur={() => undefined}>
      {#each listFeatures as feature, i}
        <li
          tabindex="0"
          data-selected={index === i}
          class:selected={index === i}
          on:mousemove={() => (index = i)}
          on:focus={() => {
            picked = feature;
            searchValue = feature.place_name.replace(/,.*/, "");
            listFeatures = [];
            index = -1;
          }}
        >
          <MarkerIcon />
          <span>{feature.place_name.replace(/,.*/, "")}</span>
          <span>{feature.place_name.replace(/[^,]*,?\s*/, "")}</span>
        </li>
      {/each}
    </ul>
  {/if}
</form>

<style>
  form,
  form *,
  form *:after,
  form *:before {
    box-sizing: border-box;
  }

  form {
    font-size: 18px;
    line-height: 24px;
    font-family: "Open Sans", "Helvetica Neue", Arial, Helvetica, sans-serif;
    position: relative;
    background-color: #fff;
    width: 100%;
    max-width: 240px;
    z-index: 10;
    border-radius: 4px;
    transition: max-width 0.25s;
    box-shadow: 0 0 10px 2px rgba(0, 0, 0, 0.1);
  }

  form.can-collapse {
    max-width: 35px;
  }

  form:focus-within,
  form:hover {
    max-width: 240px;
  }

  input {
    font: inherit;
    font-size: 15px;
    width: 100%;
    border: 0;
    background-color: transparent;
    margin: 0;
    height: 36px;
    color: rgba(0, 0, 0, 0.75);
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    padding: 0;
  }

  input:focus {
    color: rgba(0, 0, 0, 0.75);
    outline: 0;
    box-shadow: none;
    outline: none;
  }

  ul,
  div.error {
    background-color: #fff;
    border-radius: 4px;
    left: 0;
    list-style: none;
    margin: 0;
    padding: 0;
    position: absolute;
    width: 100%;
    top: calc(100% + 6px);
    overflow: hidden;
    font-size: 13px;
    box-shadow: 0 0 10px 2px rgba(0, 0, 0, 0.1);
    line-height: 1.5;
  }

  :global(.maplibregl-ctrl-bottom-left) ul,
  :global(.maplibregl-ctrl-bottom-right) ul {
    top: auto;
    bottom: 100%;
  }

  li {
    cursor: default;
    display: grid;
    grid-template-columns: auto 1fr;
    white-space: pre;
    color: #404040;
    padding: 4px 0px;
  }

  li span:nth-of-type(1) {
    font-weight: bold;
  }

  li.selected {
    background-color: #f3f3f3;
  }

  button:hover {
    background-color: transparent;
  }

  button:hover :global(svg) {
    fill: black;
  }

  button {
    padding: 0;
    margin: 0;
    border: 0;
    background-color: transparent;
  }

  .input-group {
    display: flex;
    align-items: stretch;
    gap: 7px;
    padding-inline: 8px;
  }

  .input-group:hover .displayable {
    visibility: visible;
  }

  .input-group:focus-within {
    outline-offset: 2px;
    outline: thin dotted;
    border-radius: 4px;
  }

  div.error {
    font: inherit;
    font-size: 15px;
    color: red;
    padding: 6px 10px;
  }

  .clear-button-container {
    position: relative;
    display: flex;
    align-items: stretch;
  }

  .clear-button-container button {
    visibility: hidden;
  }
</style>
