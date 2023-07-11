<script lang="ts">
  import * as L from "leaflet";
  import "leaflet/dist/leaflet.css";
  import { onMount } from "svelte";
  import { GeocodingControl } from "../../src/leaflet";

  let containerElement: HTMLElement;

  const apiKey = import.meta.env.VITE_API_KEY;

  if (!apiKey) {
    const errMsg = "missing VITE_API_KEY environment variable";

    window.alert(errMsg);

    throw new Error(errMsg);
  }

  onMount(() => {
    const map = L.map(containerElement).setView([51.505, -0.09], 13);

    const scale = devicePixelRatio > 1.5 ? "@2x" : "";

    L.tileLayer(
      `https://api.maptiler.com/maps/streets/{z}/{x}/{y}${scale}.png?key=` +
        apiKey,
      {
        tileSize: 512,
        zoomOffset: -1,
        minZoom: 1,
        attribution:
          '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a>, ' +
          '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
        crossOrigin: true,
      }
    ).addTo(map);

    new GeocodingControl({
      apiKey,
      enableReverse: "always",
      // collapsed: true,
      iconsBaseUrl: "/icons/",
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
