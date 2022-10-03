<script type="ts">
  import type maplibregl1 from "maplibre-gl";
  import { onMount } from "svelte";
  import MarkerIcon from "./MarkerIcon.svelte";
  import SuggestionIcon from "./SuggestionIcon.svelte";

  export let maplibregl: typeof maplibregl1 = undefined;

  export let map: maplibregl.Map;

  export let apiKey: string;

  export let debounceSearch = 200;

  export let placeholder = "Search";

  export let proximity: [number, number] = undefined;

  export let bbox: [number, number, number, number] = undefined;

  export let trackProximity = true;

  export let minLength = 2;

  export let limit = 5;

  export let language = navigator.language.replace(/-.*/, "");

  export let showResultsWhileTyping = true;

  export let marker: boolean | maplibregl.MarkerOptions = true;

  export let showResultMarkers: boolean | maplibregl.MarkerOptions = true;

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

  type FeatureCollection = {
    features: Feature[];
  };

  type Feature = {
    id: string;
    text: string;
    place_name: string;
    center: [number, number];
    bbox: [number, number, number, number];
  };

  let searchValue = "";

  let listFeatures: Feature[] = [];

  let markedFeatures: Feature[] = [];

  let selected: Feature | undefined;

  let picked: Feature | undefined;

  let selectedMarker: maplibregl.Marker;

  $: if (picked) {
    map.fitBounds(picked.bbox);
    listFeatures = [];
    markedFeatures = [];
    selected = undefined;
    index = -1;
  }

  $: markers: {
    if (!maplibregl) {
      break markers;
    }

    for (const marker of markers.values()) {
      marker.remove();
    }

    markers.clear();

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

        new MarkerIcon({ target: element });

        m = new maplibregl.Marker({ element });
      }

      markers.set(feature.id, m.setLngLat(feature.center).addTo(map));
    }
  }

  $: if (!searchValue) {
    picked = undefined;
    selected = undefined;
    listFeatures = [];

    if (showResultMarkers) {
      markedFeatures = listFeatures;
    }
  }

  const markers = new Map<string, maplibregl.Marker>();

  function handleOnSubmit() {
    if (selected) {
      searchValue = selected.text;
      picked = selected;
      selected = undefined;
      listFeatures = [];
      markedFeatures = [];
      index = -1;
    } else if (searchValue) {
      search(searchValue).then(() => {
        markedFeatures = listFeatures;

        zoomToResults();
      }); // TODO handle async error
    }
  }

  async function search(searchValue: string) {
    const sp = new URLSearchParams();

    sp.set("key", apiKey);

    sp.set("limit", String(limit));

    if (language) {
      sp.set("language", String(language));
    }

    if (bbox) {
      sp.set("bbox", bbox.join(","));
    }

    if (proximity) {
      sp.set("proximity", proximity.join(","));
    }

    const res = await fetch(
      "https://api.maptiler.com/geocoding/" +
        encodeURIComponent(searchValue) +
        ".json?" +
        sp.toString()
    );

    const fc: FeatureCollection = await res.json();

    listFeatures = fc.features;
  }

  function zoomToResults() {
    if (!markedFeatures.length) {
      return;
    }

    const bbox: [number, number, number, number] = [180, 90, -180, -90];

    for (const feature of markedFeatures) {
      bbox[0] = Math.min(bbox[0], feature.bbox[0]);
      bbox[1] = Math.min(bbox[1], feature.bbox[1]);
      bbox[2] = Math.max(bbox[2], feature.bbox[2]);
      bbox[3] = Math.max(bbox[3], feature.bbox[3]);
    }

    if (markedFeatures.length > 0) {
      map.fitBounds(bbox, { padding: 50 });
    }
  }

  // highlight selected marker
  $: {
    if (selectedMarker) {
      selectedMarker.getElement().classList.toggle("marker-selected", false);
    }

    selectedMarker = selected && markers.get(selected.id);

    selectedMarker?.getElement().classList.toggle("marker-selected", true);
  }

  let focusedDelayed: boolean;

  // close dropdown in the next cycle so that the selected item event has the chance to fire
  $: setTimeout(() => {
    focusedDelayed = focused;
  });

  let index = -1;

  function handleKeyDown(e: KeyboardEvent) {
    let dir = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;

    if (dir) {
      if (index === -1 && dir === -1) {
        index = 0;
      }

      if (listFeatures.length > 0) {
        index = (index + dir) % listFeatures.length;

        if (index < 0) {
          index += listFeatures.length;
        }

        selected = listFeatures[index];
      }

      e.preventDefault();
    }
  }

  $: {
    searchValue; // clear selection on edit

    selected = undefined;
    index = -1;
  }

  let searchTimeoutRef: number;

  function handleInput() {
    if (showResultsWhileTyping && searchValue.length > minLength) {
      if (searchTimeoutRef) {
        clearTimeout(searchTimeoutRef);
      }

      searchTimeoutRef = window.setTimeout(() => {
        search(searchValue); // TODO handle async error
      }, debounceSearch);
    } else {
      listFeatures = [];
    }
  }
</script>

<form on:submit|preventDefault={handleOnSubmit}>
  <SuggestionIcon />

  <input
    bind:value={searchValue}
    on:focus={() => (focused = true)}
    on:blur={() => (focused = false)}
    on:keydown={handleKeyDown}
    on:input={handleInput}
    type="search"
    {placeholder}
    aria-label={placeholder}
  />

  {#if focusedDelayed && listFeatures.length > 0}
    <ul>
      {#each listFeatures as feature}
        <li
          tabindex="0"
          class:selected={feature === selected}
          on:mouseover={() => {
            selected = feature;
            debugger;
          }}
          on:focus={() => {
            picked = feature;
            searchValue = feature.text;
            selected = undefined;
            listFeatures = [];
            index = -1;
          }}
        >
          <MarkerIcon />
          <span>{feature.text}</span>
          <span>{feature.place_name}</span>
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
    min-width: 240px;
    z-index: 1;
    border-radius: 4px;
    transition: width 0.25s, min-width 0.25s;
    box-shadow: 0 0 10px 2px rgba(0, 0, 0, 0.1);
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
    padding: 6px 10px 6px 35px;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }

  input:focus {
    color: rgba(0, 0, 0, 0.75);
    outline: 0;
    box-shadow: none;
    outline: thin dotted;
  }

  ul {
    background-color: #fff;
    border-radius: 4px;
    left: 0;
    list-style: none;
    margin: 0;
    padding: 0;
    position: absolute;
    width: 100%;
    top: calc(100% + 6px);
    z-index: 1000;
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

  li.selected,
  li:hover,
  li:focus {
    background-color: #f3f3f3;
  }
</style>
