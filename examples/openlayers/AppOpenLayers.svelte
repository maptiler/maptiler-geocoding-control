<script lang="ts">
  import Map from "ol/Map";
  import View from "ol/View";
  import { defaults as defaultControls } from "ol/control.js";
  import TileLayer from "ol/layer/Tile";
  import "ol/ol.css";
  import XYZ from "ol/source/XYZ";
  import { onMount } from "svelte";
  import { GeocodingControl } from "../../src/openlayers";

  // import { useGeographic } from "ol/proj.js";
  // useGeographic();

  let containerElement: HTMLElement;

  const apiKey =
    import.meta.env.VITE_API_KEY ||
    prompt("Please provide your MapTiler API key") ||
    "";

  const scale = devicePixelRatio > 1.5 ? "@2x" : "";

  onMount(() => {
    const geocodingControl = new GeocodingControl({
      apiKey,
      enableReverse: "always",
      // collapsed: true,
      iconsBaseUrl: "/icons/",
    });

    geocodingControl.on("querychange", (e) => {
      console.log(e);
    });

    new Map({
      target: containerElement,
      layers: [
        new TileLayer({
          source: new XYZ({
            url: `https://api.maptiler.com/maps/basic-v2/{z}/{x}/{y}${scale}.png?key=${apiKey}`,
            tileSize: 512,
            attributions: [
              '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a>',
              '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
            ],
          }),
        }),
      ],
      view: new View({
        center: [0, 0],
        zoom: 0,
      }),
      controls: defaultControls().extend([geocodingControl]),
    });
  });
</script>

<main id="main" bind:this={containerElement} />

<style>
  #main {
    position: absolute;
    inset: 0;
  }

  :global(.ol-search) {
    position: absolute;
    top: 0.5em;
    right: 0.5em;
  }
</style>
