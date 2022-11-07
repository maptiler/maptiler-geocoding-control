<script lang="ts">
  import "leaflet/dist/leaflet.css";

  import { onMount } from "svelte";
  import { GeocodingControl } from "./lib/LeafletGeocodingControl";
  import * as L from "leaflet";

  let containerElement: HTMLElement;

  const apiKey = import.meta.env.VITE_API_KEY;

  if (!apiKey) {
    const errMsg = "missing VITE_API_KEY environment variable";

    window.alert(errMsg);

    throw new Error(errMsg);
  }

  onMount(() => {
    const map = L.map(containerElement).setView([51.505, -0.09], 13);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    new GeocodingControl({
      apiKey,
      enableReverse: true,
      showPlaceType: true,
    }).addTo(map);
  });
</script>

<main id="main" bind:this={containerElement} />

<style>
  #main {
    position: absolute;
    inset: 0;
  }
</style>
