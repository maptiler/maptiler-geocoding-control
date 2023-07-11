<script lang="ts">
  import Map from "ol/Map";
  import View from "ol/View";
  import { defaults as defaultControls } from "ol/control.js";
  import TileLayer from "ol/layer/Tile";
  import "ol/ol.css";
  import TileJSON from "ol/source/TileJSON";
  import XYZ from "ol/source/XYZ";
  import { onMount } from "svelte";
  import { GeocodingControl } from "./lib/openlayers";

  let containerElement: HTMLElement;

  const apiKey = import.meta.env.VITE_API_KEY;

  if (!apiKey) {
    const errMsg = "missing VITE_API_KEY environment variable";

    window.alert(errMsg);

    throw new Error(errMsg);
  }

  onMount(() => {
    new Map({
      target: containerElement,
      layers: [
        new TileLayer({
          source: new XYZ({
            url:
              "https://api.maptiler.com/maps/basic-v2/{z}/{x}/{y}@2x.png?key=" +
              apiKey,
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
        zoom: 2,
      }),
      controls: defaultControls().extend([
        new GeocodingControl({
          apiKey,
          enableReverse: "always",
          // collapsed: true,
        }),
      ]),
    });
  });
</script>

<main id="main" bind:this={containerElement} />

<style>
  #main {
    position: absolute;
    inset: 0;
  }
</style>
