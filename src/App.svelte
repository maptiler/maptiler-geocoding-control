<script lang="ts">
  import "maplibre-gl/dist/maplibre-gl.css";

  import { Map } from "maplibre-gl";
  import { onMount } from "svelte";
  import { GeocodingControl } from "./lib/index";
  import maplibregl from "maplibre-gl";

  let containerElement: HTMLElement;

  const apiKey = "0iOk4fgsz9fOXyDYCirE";

  onMount(() => {
    const map = new Map({
      style: "https://api.maptiler.com/maps/streets/style.json?key=" + apiKey,
      container: containerElement,
    });

    map.addControl(
      new GeocodingControl({ apiKey, maplibregl, collapsed: true })
    );
  });
</script>

<main id="main" bind:this={containerElement} />

<style>
  #main {
    position: absolute;
    inset: 0;
  }
</style>
