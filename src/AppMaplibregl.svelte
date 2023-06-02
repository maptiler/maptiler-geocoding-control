<script lang="ts">
  import "maplibre-gl/dist/maplibre-gl.css";

  import { Map, NavigationControl } from "maplibre-gl";
  import { onMount } from "svelte";
  import { GeocodingControl } from "./lib/maplibregl";

  let containerElement: HTMLElement;

  const apiKey = import.meta.env.VITE_API_KEY;

  if (!apiKey) {
    const errMsg = "missing VITE_API_KEY environment variable";

    window.alert(errMsg);

    throw new Error(errMsg);
  }

  onMount(() => {
    const map = new Map({
      style: "https://api.maptiler.com/maps/streets/style.json?key=" + apiKey,
      container: containerElement,
    });

    map.addControl(
      new GeocodingControl({
        apiKey,
        enableReverse: "always",
        collapsed: true,
        limit: 20,
      })
    );

    map.addControl(new NavigationControl({}));
  });
</script>

<main id="main" bind:this={containerElement} />

<style>
  #main {
    position: absolute;
    inset: 0;
  }
</style>
