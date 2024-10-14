<script lang="ts">
  import { createEventDispatcher, onDestroy } from "svelte";
  import { default as ClearIcon } from "./ClearIcon.svelte";
  import { default as FailIcon } from "./FailIcon.svelte";
  import { default as FeatureItem } from "./FeatureItem.svelte";
  import { default as LoadingIcon } from "./LoadingIcon.svelte";
  import MarkerIcon from "./MarkerIcon.svelte";
  import { default as ReverseGeocodingIcon } from "./ReverseGeocodingIcon.svelte";
  import { default as SearchIcon } from "./SearchIcon.svelte";
  import { unwrapBbox, wrapNum } from "./geoUtils";
  import { getProximity } from "./proximity";
  import { convert } from "geo-coordinates-parser";
  import type {
    BBox,
    DispatcherType,
    Feature,
    FeatureCollection,
    MapController,
    ProximityRule,
  } from "./types";

  export const ZOOM_DEFAULTS: Record<string, number> = {
    continental_marine: 4,
    country: 4,
    major_landform: 8,
    region: 5,
    subregion: 6,
    county: 7,
    joint_municipality: 8,
    joint_submunicipality: 9,
    municipality: 10,
    municipal_district: 11,
    locality: 12,
    neighbourhood: 13,
    place: 14,
    postal_code: 14,
    road: 16,
    poi: 17,
    address: 18,
    "poi.peak": 15,
    "poi.shop": 18,
    "poi.cafe": 18,
    "poi.restaurant": 18,
    "poi.aerodrome": 13,
    // TODO add many more
  };

  let className: string | undefined = undefined;

  export { className as class };

  export let apiKey: string;

  export let bbox: BBox | undefined = undefined;

  export let clearButtonTitle = "clear";

  export let clearOnBlur = false;

  export let collapsed = false;

  export let country: string | string[] | undefined = undefined;

  export let debounceSearch = 200;

  export let enableReverse: boolean | "always" = false;

  export let errorMessage = "Something went wrong…";

  export let filter: (feature: Feature) => boolean = () => true;

  export let flyTo = true;

  export let fuzzyMatch = true;

  export let language: string | string[] | null | undefined = undefined;

  export let limit: number | undefined = undefined;

  export let mapController: MapController | undefined = undefined;

  export let minLength = 2;

  export let noResultsMessage =
    "Oops! Looks like you're trying to predict something that's not quite right. We can't seem to find what you're looking for. Maybe try double-checking your spelling or try a different search term. Keep on typing - we'll do our best to get you where you need to go!";

  export let placeholder = "Search";

  export let proximity: ProximityRule[] | null | undefined = [
    { type: "server-geolocation" },
  ];

  export let reverseActive = enableReverse === "always";

  export let reverseButtonTitle = "toggle reverse geocoding";

  export let searchValue = "";

  export let showFullGeometry = true;

  export let showPlaceType: false | "always" | "ifNeeded" = "ifNeeded";

  export let showResultsWhileTyping = true;

  export let selectFirst = true;

  export let flyToSelected = false;

  export let markerOnSelected = true;

  export let types: string[] | undefined = undefined;

  export let excludeTypes = false;

  export let zoom: number | Record<string, number> = ZOOM_DEFAULTS;

  export let maxZoom: number | undefined = undefined;

  export let apiUrl: string = import.meta.env.VITE_API_URL;

  export let fetchParameters: RequestInit = {};

  export let iconsBaseUrl =
    "https://cdn.maptiler.com/maptiler-geocoding-control/v" +
    import.meta.env.VITE_LIB_VERSION +
    "/icons/";

  export let adjustUrlQuery: (sp: URLSearchParams) => void = () => {};

  export function focus() {
    input.focus();
  }

  export function blur() {
    input.blur();
  }

  export function setQuery(value: string, submit = true, reverse = false) {
    searchValue = value;

    if (submit) {
      selectedItemIndex = -1;

      handleOnSubmit();
    } else {
      handleInput(!reverse, reverse);

      setTimeout(() => {
        input.focus();
        input.select();
      });
    }
  }

  export function clearList() {
    listFeatures = undefined;
    picked = undefined;
    selectedItemIndex = -1;
  }

  export function clearMap() {
    markedFeatures = [];
    picked = undefined;
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

  let prevIdToFly: string | undefined;

  const missingIconsCache = new Set<string>();

  const dispatch = createEventDispatcher<DispatcherType>();

  $: {
    reverseActive = enableReverse === "always";
  }

  $: if (
    showFullGeometry &&
    picked &&
    !picked.address &&
    picked.geometry.type === "Point" &&
    picked.place_type[0] !== "reverse"
  ) {
    search(picked.id, { byId: true }).catch((err) => (error = err));
  }

  $: {
    if (mapController && picked && picked.id !== prevIdToFly && flyTo) {
      if (
        !picked.bbox ||
        (picked.bbox[0] === picked.bbox[2] && picked.bbox[1] === picked.bbox[3])
      ) {
        mapController.flyTo(picked.center, computeZoom(picked));
      } else {
        mapController.fitBounds(
          unwrapBbox(picked.bbox),
          50,
          computeZoom(picked),
        );
      }

      listFeatures = undefined;
      markedFeatures = undefined;
      selectedItemIndex = -1;
    }

    prevIdToFly = picked?.id;
  }

  $: if (mapController && selected && flyTo && flyToSelected) {
    mapController.flyTo(selected.center, computeZoom(selected));
  }

  // if markerOnSelected was dynamically changed to false
  $: if (!markerOnSelected) {
    mapController?.setMarkers(undefined, undefined);
  }

  $: if (mapController && markerOnSelected && !markedFeatures) {
    mapController.setMarkers(selected ? [selected] : undefined, undefined);

    mapController.setSelectedMarker(selected ? 0 : -1);
  }

  $: if (markedFeatures !== listFeatures) {
    markedFeatures = undefined;
  }

  $: if (mapController) {
    mapController.setMarkers(markedFeatures, picked);
  }

  $: if (searchValue.length < minLength) {
    picked = undefined;
    listFeatures = undefined;
    error = undefined;
    markedFeatures = listFeatures;
  }

  // highlight selected marker
  $: if (markedFeatures && mapController) {
    mapController.setSelectedMarker(selectedItemIndex);
  }

  // close dropdown in the next cycle so that the selected item event has the chance to fire
  $: setTimeout(() => {
    focusedDelayed = focused;

    if (clearOnBlur && !focused) {
      searchValue = "";
    }
  });

  $: if (selectFirst && listFeatures?.length) {
    selectedItemIndex = 0;
  }

  // clear selection on edit
  $: {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    searchValue;

    selectedItemIndex = -1;
  }

  $: selected = listFeatures?.[selectedItemIndex];

  $: if (mapController) {
    const coords = isQueryReverse(searchValue);

    mapController.setReverseMarker(
      coords ? [coords.decimalLongitude, coords.decimalLatitude] : undefined,
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
        case "markerClick":
          {
            const feature = listFeatures?.find(
              (feature) => feature.id === e.id,
            );

            if (feature) {
              pick(feature);
            }
          }

          break;
        case "markerMouseEnter":
          if (markedFeatures) {
            selectedItemIndex = !focusedDelayed
              ? -1
              : (listFeatures?.findIndex((feature) => feature.id === e.id) ??
                -1);
          }

          break;
        case "markerMouseLeave":
          if (markedFeatures) {
            selectedItemIndex = -1;
          }

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

      searchValue =
        picked.place_type[0] === "reverse"
          ? picked.place_name
          : picked.place_name.replace(/,.*/, "");

      error = undefined;

      markedFeatures = undefined;

      selectedItemIndex = -1;
    } else if (searchValue) {
      const zoomTo = event || !isQueryReverse(searchValue);

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

  function isQueryReverse(searchValue: string) {
    try {
      return convert(searchValue, 6);
    } catch {
      return false;
    }
  }

  async function search(
    searchValue: string,
    {
      byId = false,
      exact = false,
    }: undefined | { byId?: boolean; exact?: boolean } = {},
  ) {
    error = undefined;

    abortController?.abort();

    const ac = new AbortController();

    abortController = ac;

    try {
      const isReverse = isQueryReverse(searchValue);

      const sp = new URLSearchParams();

      if (language !== undefined) {
        sp.set(
          "language",
          Array.isArray(language) ? language.join(",") : (language ?? ""),
        );
      }

      if (types) {
        sp.set("types", types.join(","));
      }

      if (excludeTypes) {
        sp.set("excludeTypes", String(excludeTypes));
      }

      if (bbox) {
        sp.set("bbox", bbox.map((c) => c.toFixed(6)).join(","));
      }

      if (country) {
        sp.set("country", Array.isArray(country) ? country.join(",") : country);
      }

      if (!byId && !isReverse) {
        const coords = await getProximity(mapController, proximity, ac);

        if (coords) {
          sp.set("proximity", coords);
        }

        if (exact || !showResultsWhileTyping) {
          sp.set("autocomplete", "false");
        }

        sp.set("fuzzyMatch", String(fuzzyMatch));
      }

      if (limit !== undefined && (!isReverse || types?.length === 1)) {
        sp.set("limit", String(limit));
      }

      sp.set("key", apiKey);

      adjustUrlQuery(sp);

      const url =
        apiUrl +
        "/" +
        encodeURIComponent(
          isReverse
            ? isReverse.decimalLongitude + "," + isReverse.decimalLatitude
            : searchValue,
        ) +
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

      const res = await fetch(url, {
        signal: ac.signal,
        ...fetchParameters,
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const featureCollection: FeatureCollection = await res.json();

      dispatch("response", { url, featureCollection });

      if (byId) {
        listFeatures = undefined;

        picked = featureCollection.features[0];

        cachedFeatures = [picked];
      } else {
        listFeatures = featureCollection.features.filter(filter);

        if (isReverse) {
          listFeatures.unshift({
            type: "Feature",
            properties: {},
            id:
              "reverse_" +
              isReverse.decimalLongitude +
              "_" +
              isReverse.decimalLatitude,
            text: isReverse.decimalLatitude + ", " + isReverse.decimalLongitude,
            place_name:
              isReverse.decimalLatitude + ", " + isReverse.decimalLongitude,
            place_type: ["reverse"],
            center: [isReverse.decimalLongitude, isReverse.decimalLatitude],
            bbox: [
              isReverse.decimalLongitude,
              isReverse.decimalLatitude,
              isReverse.decimalLongitude,
              isReverse.decimalLatitude,
            ],
            geometry: {
              type: "Point",
              coordinates: [
                isReverse.decimalLongitude,
                isReverse.decimalLatitude,
              ],
            },
          });
        }

        cachedFeatures = listFeatures;

        if (isReverse) {
          input.focus();
        }
      }
    } catch (e) {
      if (
        e &&
        typeof e === "object" &&
        "name" in e &&
        e.name === "AbortError"
      ) {
        return;
      }

      throw e;
    } finally {
      if (ac === abortController) {
        abortController = undefined;
      }
    }
  }

  function zoomToResults() {
    if (!markedFeatures?.length || !flyTo) {
      return;
    }

    const bbox: BBox = [180, 90, -180, -90];

    const fuzzyOnly = !markedFeatures.some((feature) => !feature.matching_text);

    let allZoom: number | undefined;

    for (const feature of markedFeatures) {
      const featZoom = computeZoom(feature);

      allZoom =
        maxZoom ??
        (allZoom === undefined
          ? featZoom
          : featZoom === undefined
            ? allZoom
            : Math.max(allZoom, featZoom));

      if (fuzzyOnly || !feature.matching_text) {
        for (const i of [0, 1, 2, 3] as const) {
          bbox[i] = Math[i < 2 ? "min" : "max"](
            bbox[i],
            feature.bbox?.[i] ?? feature.center[i % 2],
          );
        }
      }
    }

    if (mapController && markedFeatures.length > 0) {
      if (picked && bbox[0] === bbox[2] && bbox[1] === bbox[3]) {
        mapController.flyTo(picked.center, computeZoom(picked));
      } else {
        mapController.fitBounds(unwrapBbox(bbox), 50, allZoom);
      }
    }
  }

  function computeZoom(feature: Feature): number | undefined {
    if (
      !feature.bbox ||
      (feature.bbox[0] !== feature.bbox[2] &&
        feature.bbox[1] !== feature.bbox[3])
    ) {
      return undefined;
    }

    if (typeof zoom === "number") {
      return feature.id.startsWith("poi.") || feature.id.startsWith("address.")
        ? maxZoom
        : zoom;
    }

    const index = feature.id.replace(/\..*/, "");

    return (
      (Array.isArray(feature.properties?.categories)
        ? (feature.properties.categories as string[]).reduce(
            (a, category) => {
              const b = zoom[index + "." + category];

              return a === undefined ? b : b === undefined ? a : Math.max(a, b);
            },
            undefined as undefined | number,
          )
        : undefined) ?? zoom[index]
    );
  }

  function handleReverse(coordinates: [lng: number, lat: number]) {
    reverseActive = enableReverse === "always";

    listFeatures = undefined;
    picked = undefined;
    selectedItemIndex = -1;

    setQuery(
      coordinates[1].toFixed(6) +
        ", " +
        wrapNum(coordinates[0], [-180, 180], true).toFixed(6),
      false,
      true,
    );
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (!listFeatures) {
      return;
    }

    let dir = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;

    if (dir) {
      if (selectedItemIndex === (selectFirst ? 0 : -1) && dir === -1) {
        selectedItemIndex = listFeatures.length;
      }

      selectedItemIndex += dir;

      if (selectedItemIndex >= listFeatures.length) {
        selectedItemIndex = -1;
      }

      if (selectedItemIndex < 0 && selectFirst) {
        selectedItemIndex = 0;
      }

      e.preventDefault();
    }
  }

  function handleInput(debounce = true, reverse = false) {
    error = undefined;

    if (showResultsWhileTyping || reverse) {
      if (searchTimeoutRef) {
        clearTimeout(searchTimeoutRef);
      }

      if (searchValue.length < minLength) {
        return;
      }

      const sv = searchValue;

      searchTimeoutRef = window.setTimeout(
        () => {
          search(sv).catch((err) => (error = err));
        },
        debounce ? debounceSearch : 0,
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

{#if false}
  <!-- This workaround is just to use marker styles. Bug in svlete/vite? Investigate. -->
  <MarkerIcon displayIn="list" />
{/if}

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<form
  tabindex="0"
  on:submit|preventDefault={handleOnSubmit}
  class:can-collapse={collapsed && searchValue === ""}
  class={className}
>
  <div class="input-group">
    <button class="search-button" type="button" on:click={() => input.focus()}>
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

    <div class="clear-button-container" class:displayable={searchValue !== ""}>
      <button
        type="button"
        on:click={() => {
          searchValue = "";
          input.focus();
        }}
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
    <div class="error">
      <FailIcon />

      <div>{errorMessage}</div>

      <button on:click={() => (error = undefined)}>
        <ClearIcon />
      </button>
    </div>
  {:else if !focusedDelayed}
    {""}
  {:else if listFeatures?.length === 0}
    <div class="no-results">
      <FailIcon />

      <div>{noResultsMessage}</div>
    </div>
  {:else if focusedDelayed && listFeatures?.length}
    <ul
      on:mouseleave={() => {
        if (!selectFirst) {
          selectedItemIndex = -1;
        }
      }}
      on:blur={() => undefined}
    >
      {#each listFeatures as feature, i (feature.id + (feature.address ? "," + feature.address : ""))}
        <FeatureItem
          {feature}
          {showPlaceType}
          selected={selectedItemIndex === i}
          on:mouseenter={() => (selectedItemIndex = i)}
          on:focus={() => pick(feature)}
          {missingIconsCache}
          {iconsBaseUrl}
        />
      {/each}
    </ul>
  {/if}
</form>

<style lang="scss">
  form {
    font-family: "Open Sans", "Ubuntu", "Helvetica Neue", Arial, Helvetica,
      sans-serif;
    position: relative;
    background-color: #fff;
    z-index: 10;
    border-radius: 4px;
    margin: 0;
    transition: max-width 0.25s;
    box-shadow: 0px 2px 5px rgba(51, 51, 89, 0.15);
    --color-text: #444952;
    --color-icon-button: #444952;

    &,
    & *,
    & *:after,
    & *:before {
      box-sizing: border-box;
    }

    &.can-collapse {
      max-width: 29px;

      & input::placeholder {
        transition: opacity 0.25s;
        opacity: 0;
      }
    }

    &,
    &:focus-within,
    &:hover {
      width: 270px;
      max-width: 270px;

      & input::placeholder {
        opacity: 1;
      }
    }
  }

  input {
    font: inherit;
    font-size: 14px;
    flex-grow: 1;
    min-height: 29px;
    background-color: transparent;
    color: #444952;
    white-space: nowrap;
    overflow: hidden;
    border: 0;
    margin: 0;
    padding: 0;

    &:focus {
      color: #444952;
      outline: 0;
      outline: none;
      box-shadow: none;
    }
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
    overflow: hidden;
  }

  ul {
    font-size: 14px;
    line-height: 16px;
    box-shadow: 0px 5px 10px rgba(51, 51, 89, 0.15);
  }

  div.error,
  div.no-results {
    font: inherit;
    line-height: 18px;
    font-size: 12px;
    display: flex;
    gap: 16px;
  }

  div.error {
    padding: 16px;
    font-weight: 600;
    color: #e25041;
    background-color: #fbeae8;

    div {
      flex-grow: 1;
    }

    :global(svg) {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
    }

    button {
      flex-shrink: 0;
      & > :global(svg) {
        width: 13px;
        fill: #e25041;
      }

      &:hover :global(svg),
      &:active :global(svg) {
        fill: #444952;
      }
    }
  }

  div.no-results {
    padding: 14px 24px 14px 16px;
    font-weight: 400;
    color: #6b7c93;
    box-shadow: 0px 5px 10px rgba(51, 51, 89, 0.15);

    :global(svg) {
      margin-top: 4px;
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      width: 30px;
      height: 30px;
    }
  }

  :global(.maplibregl-ctrl-bottom-left) ul,
  :global(.maplibregl-ctrl-bottom-right) ul {
    top: auto;
    bottom: 100%;
  }

  button {
    padding: 0;
    margin: 0;
    border: 0;
    background-color: transparent;
    height: auto;
    width: auto;

    &:hover {
      background-color: transparent;
    }
  }

  button:hover :global(svg),
  button:active :global(svg) {
    fill: #2b8bfb;
  }

  .input-group {
    display: flex;
    align-items: stretch;
    gap: 7px;
    padding-inline: 8px;
    border-radius: 4px;
    overflow: hidden;

    &:focus-within {
      outline: #2b8bfb solid 2px;
    }
  }

  .search-button {
    flex-shrink: 0;
  }

  :global(.maplibregl-ctrl-geocoder:not(.maptiler-ctrl) .search-button svg) {
    width: 12px !important;
    transform: translate(0.5px, 0);
  }

  .clear-button-container {
    display: flex;
    display: none;
    position: relative;
    align-items: stretch;

    &.displayable {
      display: flex;
      flex-shrink: 0;
    }
  }

  :global(.maplibregl-ctrl-geocoder) {
    position: relative;
    z-index: 3;
  }

  :global(.maptiler-ctrl) {
    &:not(:empty) {
      box-shadow: none;
    }

    & .input-group {
      padding-inline: 8px;
      border: white solid 2px;

      &:focus-within {
        border: #2b8bfb solid 2px;
        outline: 0;
        outline: none;
      }
    }

    & form {
      &.can-collapse {
        max-width: 33px;
      }

      &,
      &:focus-within,
      &:hover {
        width: 270px;
        max-width: 270px;
      }
    }
  }
</style>
