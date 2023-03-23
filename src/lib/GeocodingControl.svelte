<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { onDestroy } from "svelte/internal";
  import ReverseGeocodingIcon from "./ReverseGeocodingIcon.svelte";
  import ClearIcon from "./ClearIcon.svelte";
  import LoadingIcon from "./LoadingIcon.svelte";
  import MarkerIcon from "./MarkerIcon.svelte";
  import SearchIcon from "./SearchIcon.svelte";
  import type {
    Feature,
    FeatureCollection,
    MapController,
    Proximity,
  } from "./types";

  let className: string | undefined = undefined;

  export { className as class };

  export let apiKey: string;

  export let bbox: [number, number, number, number] | undefined = undefined;

  export let clearButtonTitle = "clear";

  export let clearOnBlur = false;

  export let collapsed = false;

  export let country: string | string[] | undefined = undefined;

  export let debounceSearch = 200;

  export let enableReverse: boolean | "always" = false;

  export let errorMessage = "Searching failed";

  export let filter: (feature: Feature) => boolean = () => true;

  export let flyTo = true;

  export let fuzzyMatch = true;

  export let language: string | string[] | undefined = undefined;

  export let limit: number | undefined = undefined;

  export let mapController: MapController | undefined = undefined;

  export let minLength = 2;

  export let noResultsMessage = "No results found";

  export let placeholder = "Search";

  export let proximity: Proximity = undefined;

  export let reverseActive = enableReverse === "always";

  export let reverseButtonTitle = "toggle reverse geocoding";

  export let searchValue = "";

  export let showFullGeometry = true;

  export let showPlaceType = false;

  export let showResultsWhileTyping = true;

  export let trackProximity = true;

  export let types: string[] | undefined = undefined;

  export let zoom = 16;

  export let fetchParameters: RequestInit = {};

  export function focus() {
    input.focus();
  }

  export function blur() {
    input.blur();
  }

  export function setQuery(value: string, submit = true) {
    searchValue = value;

    if (submit) {
      selectedItemIndex = -1;

      handleOnSubmit();
    } else {
      handleInput();

      setTimeout(() => {
        input.focus();
        input.select();
      });
    }
  }

  let focused = false;

  let listFeatures: Feature[] | undefined;

  let markedFeatures: Feature[] | undefined;

  let picked: Feature | undefined;

  let lastSearchUrl = "";

  let input: HTMLInputElement;

  let selectedItemIndex = -1;

  let error: unknown;

  let cachedFeatures: Feature[] = [];

  let abortController: AbortController | undefined;

  let searchTimeoutRef: number | undefined;

  let focusedDelayed: boolean;

  const dispatch = createEventDispatcher<{
    select: Feature;
    pick: Feature;
    optionsVisibilityChange: boolean;
    featuresListed: Feature[];
    featuresMarked: Feature[];
    response: { url: string; featureCollection: FeatureCollection };
    reverseToggle: boolean;
    queryChange: string;
  }>();

  $: if (!trackProximity) {
    proximity = undefined;
  }

  $: if (
    showFullGeometry &&
    picked &&
    !picked.address &&
    picked.geometry.type === "Point"
  ) {
    search(picked.id, { byId: true }).catch((err) => (error = err));
  }

  $: if (mapController && picked && flyTo) {
    if (
      !picked.bbox ||
      (picked.bbox[0] === picked.bbox[2] && picked.bbox[1] === picked.bbox[3])
    ) {
      mapController.flyTo(picked.center, zoom);
    } else {
      mapController.fitBounds(picked.bbox, 50);
    }

    listFeatures = undefined;
    markedFeatures = undefined;
    selectedItemIndex = -1;
  }

  $: if (markedFeatures !== listFeatures) {
    markedFeatures = undefined;
  }

  $: if (mapController) {
    mapController.setMarkers(markedFeatures, picked);
  }

  $: if (!searchValue) {
    picked = undefined;
    listFeatures = undefined;
    error = undefined;
    markedFeatures = listFeatures;
  }

  // highlight selected marker
  $: mapController?.setSelectedMarker(selectedItemIndex);

  // close dropdown in the next cycle so that the selected item event has the chance to fire
  $: setTimeout(() => {
    focusedDelayed = focused;

    if (clearOnBlur && !focused) {
      searchValue = "";
    }
  });

  // clear selection on edit
  $: {
    searchValue;

    selectedItemIndex = -1;
  }

  $: selected = listFeatures?.[selectedItemIndex];

  $: {
    const m = /^(-?\d+(?:\.\d*)?),(-?\d+(?:\.\d*)?)$/.exec(searchValue);

    mapController?.setReverseMarker(
      m ? [Number(m[1]), Number(m[2])] : undefined
    );
  }

  $: dispatch("select", selected);

  $: dispatch("pick", picked);

  $: dispatch("optionsVisibilityChange", focusedDelayed && !!listFeatures);

  $: dispatch("featuresListed", listFeatures);

  $: dispatch("featuresMarked", markedFeatures);

  $: dispatch("reverseToggle", reverseActive);

  $: dispatch("queryChange", searchValue);

  $: if (mapController) {
    mapController.indicateReverse(reverseActive);
  }

  $: if (mapController) {
    mapController.setEventHandler((e) => {
      switch (e.type) {
        case "mapClick":
          if (reverseActive) {
            handleReverse(e.coordinates);
          }

          break;
        case "proximityChange":
          proximity = trackProximity ? e.proximity : undefined;

          break;
        case "markerClick":
          {
            const feature = listFeatures?.find(
              (feature) => feature.id === e.id
            );

            if (feature) {
              pick(feature);
            }
          }

          break;
        case "markerMouseEnter":
          selectedItemIndex = !focusedDelayed
            ? -1
            : listFeatures?.findIndex((feature) => feature.id === e.id) ?? -1;

          break;
        case "markerMouseLeave":
          selectedItemIndex = -1;

          break;
      }
    });
  }

  onDestroy(() => {
    if (mapController) {
      mapController.setEventHandler(undefined);
      mapController.indicateReverse(false);
      mapController.setSelectedMarker(-1);
      mapController.setMarkers(undefined, undefined);
    }
  });

  function handleOnSubmit(event?: unknown) {
    if (searchTimeoutRef) {
      clearTimeout(searchTimeoutRef);

      searchTimeoutRef = undefined;
    }

    if (selectedItemIndex > -1 && listFeatures) {
      picked = listFeatures[selectedItemIndex];
      searchValue = picked.place_name.replace(/,.*/, "");
      error = undefined;
      markedFeatures = undefined;
      selectedItemIndex = -1;
    } else if (searchValue) {
      const zoomTo = event || !isQuerReverse();

      search(searchValue, { exact: true })
        .then(() => {
          markedFeatures = listFeatures;

          picked = undefined;

          if (zoomTo) {
            zoomToResults();
          }
        })
        .catch((err) => (error = err));
    }
  }

  function isQuerReverse() {
    return /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(searchValue);
  }

  async function search(
    searchValue: string,
    {
      byId = false,
      exact = false,
    }: undefined | { byId?: boolean; exact?: boolean } = {}
  ) {
    error = undefined;

    const isReverse = isQuerReverse();

    const sp = new URLSearchParams();

    if (language != undefined) {
      sp.set(
        "language",
        Array.isArray(language) ? language.join(",") : language
      );
    }

    if (types) {
      sp.set("types", types.join(","));
    }

    if (!isReverse) {
      if (bbox) {
        sp.set("bbox", bbox.map((c) => c.toFixed(6)).join(","));
      }

      if (country) {
        sp.set("country", Array.isArray(country) ? country.join(",") : country);
      }
    }

    if (!byId) {
      if (proximity) {
        sp.set("proximity", proximity.map((c) => c.toFixed(6)).join(","));
      }

      if (exact || !showResultsWhileTyping) {
        sp.set("autocomplete", "false");
      }

      sp.set("fuzzyMatch", String(fuzzyMatch));
    }

    if (limit !== undefined) {
      sp.set("limit", String(limit));
    }

    sp.set("key", apiKey);

    const url =
      import.meta.env.VITE_API_URL +
      "/" +
      encodeURIComponent(searchValue.replaceAll(";", ",")) +
      ".json?" +
      sp.toString();

    if (url === lastSearchUrl) {
      if (byId) {
        listFeatures = undefined;

        picked = cachedFeatures[0];
      } else {
        listFeatures = cachedFeatures;
      }

      return;
    }

    lastSearchUrl = url;

    abortController?.abort();

    const ac = new AbortController();

    abortController = ac;

    let res: Response;

    try {
      res = await fetch(url, {
        signal: ac.signal,
        ...fetchParameters,
      }).finally(() => {
        if (ac === abortController) {
          abortController = undefined;
        }
      });
    } catch (e) {
      if (e && typeof e === "object" && (e as any).name === "AbortError") {
        return;
      }

      throw new Error();
    }

    if (!res.ok) {
      throw new Error();
    }

    const featureCollection: FeatureCollection = await res.json();

    dispatch("response", { url, featureCollection });

    if (byId) {
      listFeatures = undefined;

      picked = featureCollection.features[0];

      cachedFeatures = [picked];
    } else {
      listFeatures = featureCollection.features.filter(filter);

      cachedFeatures = listFeatures;

      if (isReverse) {
        input.focus();
      }
    }
  }

  function zoomToResults() {
    if (!markedFeatures?.length || !flyTo) {
      return;
    }

    const bbox: [number, number, number, number] = [180, 90, -180, -90];

    const fuzzyOnly = !markedFeatures.some((feature) => !feature.matching_text);

    for (const feature of markedFeatures) {
      if (fuzzyOnly || !feature.matching_text) {
        bbox[0] = Math.min(bbox[0], feature.bbox?.[0] ?? feature.center[0]);
        bbox[1] = Math.min(bbox[1], feature.bbox?.[1] ?? feature.center[1]);
        bbox[2] = Math.max(bbox[2], feature.bbox?.[2] ?? feature.center[0]);
        bbox[3] = Math.max(bbox[3], feature.bbox?.[3] ?? feature.center[1]);
      }
    }

    if (mapController && markedFeatures.length > 0) {
      if (picked && bbox[0] === bbox[2] && bbox[1] === bbox[3]) {
        mapController.flyTo(picked.center, zoom);
      } else {
        mapController.fitBounds(bbox, 50);
      }
    }
  }

  // taken from Leaflet
  function wrapNum(x: number, range: [number, number], includeMax: boolean) {
    const max = range[1],
      min = range[0],
      d = max - min;

    return x === max && includeMax ? x : ((((x - min) % d) + d) % d) + min;
  }

  function handleReverse(coordinates: [lng: number, lat: number]) {
    reverseActive = enableReverse === "always";

    setQuery(
      wrapNum(coordinates[0], [-180, 180], true).toFixed(6) +
        "," +
        coordinates[1].toFixed(6)
    );
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (!listFeatures) {
      return;
    }

    let dir = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;

    if (dir) {
      if (selectedItemIndex === -1 && dir === -1) {
        selectedItemIndex = listFeatures.length;
      }

      selectedItemIndex += dir;

      if (selectedItemIndex >= listFeatures.length) {
        selectedItemIndex = -1;
      }

      e.preventDefault();
    } else if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
      selectedItemIndex = -1;
    }
  }

  function handleInput(debounce = true) {
    if (showResultsWhileTyping && searchValue.length > minLength) {
      if (searchTimeoutRef) {
        clearTimeout(searchTimeoutRef);
      }

      const sv = searchValue;

      searchTimeoutRef = window.setTimeout(
        () => {
          search(sv).catch((err) => (error = err));
        },
        debounce ? debounceSearch : 0
      );
    } else {
      listFeatures = undefined;
      error = undefined;
    }
  }

  function pick(feature: Feature) {
    picked = feature;
    searchValue = feature.place_name;
    selectedItemIndex = -1;
  }
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<form
  tabindex="0"
  on:submit|preventDefault={handleOnSubmit}
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
      on:input={() => handleInput()}
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
        title={clearButtonTitle}
      >
        <ClearIcon />
      </button>

      {#if abortController}
        <LoadingIcon />
      {/if}
    </div>

    {#if enableReverse === true}
      <button
        type="button"
        class:active={reverseActive}
        title={reverseButtonTitle}
        on:click={() => (reverseActive = !reverseActive)}
      >
        <ReverseGeocodingIcon />
      </button>
    {/if}

    <slot />
  </div>

  {#if error}
    <div class="error">{errorMessage}</div>
  {:else if !focusedDelayed}
    {""}
  {:else if listFeatures?.length === 0}
    <div class="no-results">{noResultsMessage}</div>
  {:else if focusedDelayed && listFeatures?.length}
    <ul
      on:mouseleave={() => (selectedItemIndex = -1)}
      on:blur={() => undefined}
    >
      {#each listFeatures as feature, i}
        <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
        <li
          tabindex="0"
          data-selected={selectedItemIndex === i}
          class:selected={selectedItemIndex === i}
          on:mouseenter={() => (selectedItemIndex = i)}
          on:focus={() => pick(feature)}
        >
          <MarkerIcon displayIn="list" />
          <span>
            <span>
              <span>{feature.place_name.replace(/,.*/, "")}</span>
              {#if showPlaceType}
                <span
                  >{feature.properties?.place_type_name?.[0] ??
                    feature.place_type[0]}</span
                >
              {/if}
            </span>
          </span>
          <span>
            <span>{feature.place_name.replace(/[^,]*,?\s*/, "")}</span>
          </span>
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
    font-family: "Ubuntu", "Open Sans", "Helvetica Neue", Arial, Helvetica,
      sans-serif;
    position: relative;
    background-color: #fff;
    width: 100%;
    z-index: 10;
    border-radius: 4px;
    transition: max-width 0.25s;
    box-shadow: 0px 2px 8px rgba(51, 51, 89, 0.15);
    --color-text: #333359;
    --color-icon-button: #333359;
  }

  form.can-collapse {
    max-width: 35px;
  }

  form,
  form:focus-within,
  form:hover {
    max-width: 240px;
  }

  input {
    font: inherit;
    font-size: 14px;
    width: 100%;
    border: 0;
    background-color: transparent;
    margin: 0;
    height: 36px;
    color: rgba(0, 0, 0, 0.75);
    white-space: nowrap;
    overflow: hidden;
    padding: 0;
  }

  input:focus {
    color: rgba(0, 0, 0, 0.75);
    outline: 0;
    outline: none;
    box-shadow: none;
  }

  ul,
  div.error,
  div.no-results {
    background-color: #fff;
    border-radius: 4px;
    left: 0;
    list-style: none;
    margin: 0;
    padding: 0;
    position: absolute;
    width: 100%;
    top: calc(100% + 6px);
    font-size: 14px;
    box-shadow: 0px 2px 8px rgba(51, 51, 89, 0.15);
    line-height: 16px;
    overflow: hidden;
  }

  :global(.maplibregl-ctrl-bottom-left) ul,
  :global(.maplibregl-ctrl-bottom-right) ul {
    top: auto;
    bottom: 100%;
  }

  li {
    text-align: left;
    cursor: default;
    display: grid;
    grid-template-columns: auto 1fr;
    color: var(--color-text);
    padding: 4px 0px;
  }

  li:first-child {
    padding-top: 8px;
  }

  li:last-child {
    padding-bottom: 8px;
  }

  li > span {
    /* text-overflow: ellipsis; */
    overflow: hidden;
    padding-right: 8px;
  }

  li > span > span {
    white-space: nowrap;
    display: block;
    min-width: fit-content;
  }

  li.selected > span > span {
    animation: backAndForth 5s linear infinite;
  }

  li > span:nth-of-type(1) > span > span:nth-of-type(1) {
    font-weight: bold;
  }

  li > span:nth-of-type(1) > span > span:nth-of-type(2) {
    color: #aeb6c7;
    font-size: 12px;
    padding-left: 4px;
  }

  li.selected {
    background-color: #f3f3f3;
  }

  button:hover {
    background-color: transparent;
  }

  button:hover :global(svg),
  button.active :global(svg) {
    fill: #6b7c92;
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
    outline: #c1cfe4 solid 2px;
    border-radius: 4px;
    overflow: hidden;
  }

  .input-group:hover .displayable {
    visibility: visible;
  }

  .input-group:focus-within {
    outline: #3170fe solid 2px;
  }

  div.error,
  div.no-results {
    font: inherit;
    font-size: 14px;
    padding: 6px 10px;
  }

  div.error {
    color: #e25041;
  }

  div.no-results {
    color: var(--color-text);
  }

  .clear-button-container {
    position: relative;
    display: flex;
    align-items: stretch;
  }

  .clear-button-container button {
    visibility: hidden;
  }

  @keyframes backAndForth {
    0% {
      transform: translateX(0);
    }
    10% {
      transform: translateX(0);
    }
    45% {
      transform: translateX(calc(-100% + 196px));
    }
    55% {
      transform: translateX(calc(-100% + 196px));
    }
    90% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(0);
    }
  }

  form.can-collapse button:not(:nth-of-type(1)) {
    opacity: 0;
    transition: opacity 0.25s;
  }

  form.can-collapse:focus-within :not(:nth-of-type(1)),
  form.can-collapse:hover :not(:nth-of-type(1)) {
    opacity: 1;
  }
</style>
