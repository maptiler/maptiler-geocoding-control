<script lang="ts">
  import * as maptilersdk from "@maptiler/sdk";
  import "@maptiler/sdk/dist/maptiler-sdk.css";
  import { onMount } from "svelte";
  import { GeocodingControl } from "../../src/maptilersdk";

  let containerElement: HTMLElement;

  maptilersdk.config.apiKey = import.meta.env.VITE_API_KEY;

  maptilersdk.config.apiKey =
    import.meta.env.VITE_API_KEY ||
    prompt("Please provide your MapTiler API key") ||
    "";

  onMount(() => {
    const map = new maptilersdk.Map({
      style: maptilersdk.MapStyle.STREETS,
      container: containerElement,
      navigationControl: true,
    });

    const gc = new GeocodingControl({
      enableReverse: "always",
      collapsed: false,
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
    });

    map.addControl(gc);

    setTimeout(() => {
      gc.setOptions({ enableReverse: true });
    }, 5000);
  });
</script>

<main id="main" bind:this={containerElement} />

<style>
  #main {
    position: absolute;
    inset: 0;
  }
</style>
