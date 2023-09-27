<script lang="ts">
  import { Map, NavigationControl } from "maplibre-gl";
  import "maplibre-gl/dist/maplibre-gl.css";
  import { onMount } from "svelte";
  import { GeocodingControl } from "../../src/maplibregl";

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
        // limit: 20,
        // types: ["poi"],
        // fetchParameters: { credentials: "include" },
        iconsBaseUrl: "/icons/",
        proximity: [
          { type: "map-center", minZoom: 12 },
          { type: "client-geolocation", minZoom: 8 },
          { type: "server-geolocation", minZoom: 8 },
        ],
      }),
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
