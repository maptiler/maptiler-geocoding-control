<script type="ts">
  export let inMap = false;
</script>

<svg
  width={inMap ? "70" : "20px"}
  viewBox="0 0 70 85"
  fill="none"
  class:geocoding-marker={inMap}
>
  <path
    stroke-width="4"
    fill-rule="evenodd"
    clip-rule="evenodd"
    d="M 5,33.103579 C 5,17.607779 18.457,5 35,5 C 51.543,5 65,17.607779 65,33.103579 C 65,56.388679 40.4668,76.048179 36.6112,79.137779 C 36.3714,79.329879 36.2116,79.457979 36.1427,79.518879 C 35.8203,79.800879 35.4102,79.942779 35,79.942779 C 34.5899,79.942779 34.1797,79.800879 33.8575,79.518879 C 33.7886,79.457979 33.6289,79.330079 33.3893,79.138079 C 29.5346,76.049279 5,56.389379 5,33.103579 Z M 35.0001,49.386379 C 43.1917,49.386379 49.8323,42.646079 49.8323,34.331379 C 49.8323,26.016779 43.1917,19.276479 35.0001,19.276479 C 26.8085,19.276479 20.1679,26.016779 20.1679,34.331379 C 20.1679,42.646079 26.8085,49.386379 35.0001,49.386379 Z"
  />
</svg>

<style>
  svg {
    grid-row: 1/3;
    align-self: center;
    margin: 8px;
    fill: #6b7c93;
    stroke: #6b7c93;
  }

  .geocoding-marker {
    position: relative;
    top: -10px;
    height: 30px;
  }

  :global(.maplibregl-canvas-container .marker-selected) {
    z-index: 1;
  }

  :global(.maplibregl-canvas-container) svg path {
    fill: #3170fe;
    stroke: #3170fe;
  }

  :global(.marker-selected) svg path {
    fill: #98b7ff;
    stroke: #3170fe;
  }
</style>
