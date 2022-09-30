<script type="ts">
  import { Map as MaplibreMap, Marker } from "maplibre-gl";
  import MarkerIcon from "./MarkerIcon.svelte";
  import SuggestionIcon from "./SuggestionIcon.svelte";

  export let map: MaplibreMap;

  export let apiKey: string;

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

  let searchValue: string;

  let features: Feature[] = [];

  let selected: Feature | undefined;

  let picked: Feature | undefined;

  let selectedMarker: Marker;

  $: if (picked) {
    map.fitBounds(picked.bbox);
  }

  $: {
    for (const marker of markers.values()) {
      marker.remove();
    }

    markers.clear();

    for (const feature of picked ? [...features, picked] : features) {
      const element = document.createElement("div");

      new MarkerIcon({ target: element });

      markers.set(
        feature.id,
        new Marker({ element }).setLngLat(feature.center).addTo(map)
      );
    }
  }

  $: if (!searchValue) {
    picked = undefined;
    selected = undefined;
    features = [];
  }

  const markers = new Map<string, Marker>();

  async function handleOnSubmit() {
    if (selected) {
      searchValue = selected.text;
      picked = selected;
      selected = undefined;
      features = [];
      index = -1;
      return;
    }

    if (!searchValue) {
      return;
    }

    const res = await fetch(
      "https://api.maptiler.com/geocoding/" +
        encodeURIComponent(searchValue) +
        ".json?key=" +
        apiKey
    );

    const fc: FeatureCollection = await res.json();

    const bbox: [number, number, number, number] = [180, 90, -180, -90];

    for (const feature of fc.features) {
      const element = document.createElement("div");

      new MarkerIcon({ target: element });

      bbox[0] = Math.min(bbox[0], feature.bbox[0]);
      bbox[1] = Math.min(bbox[1], feature.bbox[1]);
      bbox[2] = Math.max(bbox[2], feature.bbox[2]);
      bbox[3] = Math.max(bbox[3], feature.bbox[3]);

      markers.set(
        feature.id,
        new Marker({ element }).setLngLat(feature.center).addTo(map)
      );
    }

    if (fc.features.length > 0) {
      map.fitBounds(bbox, { padding: 50 });
    }

    features = fc.features;
  }

  $: {
    if (selectedMarker) {
      selectedMarker.getElement().classList.toggle("marker-selected", false);
    }

    selectedMarker = selected && markers.get(selected.id);

    selectedMarker?.getElement().classList.toggle("marker-selected", true);
  }

  let focusedDelayed: boolean;

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

      if (features.length > 0) {
        index = (index + dir) % features.length;

        if (index < 0) {
          index += features.length;
        }

        selected = features[index];
      }

      e.preventDefault();
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
    type="search"
    placeholder="Search"
    aria-label="Search"
  />

  {#if focusedDelayed && features.length > 0}
    <ul>
      {#each features as feature}
        <li
          tabindex="0"
          class:selected={feature === selected}
          on:mouseover={() => (selected = feature)}
          on:focus={() => {
            picked = feature;
            searchValue = feature.text;
            selected = undefined;
            features = [];
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
    padding: 4px 8px;
    display: grid;
    grid-template-columns: auto 1fr;
    white-space: pre;
    color: #404040;
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
