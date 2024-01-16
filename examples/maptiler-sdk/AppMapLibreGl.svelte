<script lang="ts">
  import * as maptilersdk from "@maptiler/sdk";
  import "@maptiler/sdk/dist/maptiler-sdk.css";
  import { onMount } from "svelte";
  import { GeocodingControl } from "../../src/maptilersdk";

  let containerElement: HTMLElement;

  maptilersdk.config.apiKey = import.meta.env.VITE_API_KEY;

  const apiKey = import.meta.env.VITE_API_KEY;

  if (!apiKey) {
    const errMsg = "missing VITE_API_KEY environment variable";

    window.alert(errMsg);

    throw new Error(errMsg);
  }

  onMount(() => {
    const map = new maptilersdk.Map({
      style: maptilersdk.MapStyle.STREETS,
      container: containerElement,
      navigationControl: true,
    });

    map.addControl(
      new GeocodingControl({
        enableReverse: "always",
        collapsed: true,
        // limit: 20,
        // types: ["poi"],
        // fetchParameters: { credentials: "include" },
        // selectFirst: false,
        iconsBaseUrl: "/icons/",
        proximity: [
          { type: "map-center", minZoom: 12 },
          { type: "client-geolocation", minZoom: 8 },
          { type: "server-geolocation", minZoom: 8 },
        ],
      }),
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
