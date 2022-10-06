<script type="ts">
  export let inMap = false;
</script>

<svg
  width="20"
  height="20"
  viewBox="0 0 24 32"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  class:geocoding-marker={inMap}
>
  <path
    stroke={inMap ? "white" : undefined}
    stroke-width={inMap ? 1.5 : undefined}
    d="M12 0C5.36571 0 0 5.38676 0 12.0471C0 21.0824 12 32 12 32C12 32 24 21.0824 24 12.0471C24 5.38676 18.6343 0 12 0ZM12 16.3496C9.63428 16.3496 7.71429 14.4221 7.71429 12.0471C7.71429 9.67207 9.63428 7.74454 12 7.74454C14.3657 7.74454 16.2857 9.67207 16.2857 12.0471C16.2857 14.4221 14.3657 16.3496 12 16.3496Z"
    fill="#687078"
  />
</svg>

<style>
  svg {
    grid-row: 1/3;
    align-self: center;
    margin: 8px;
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
    fill: #761fe8;
  }

  :global(.marker-selected) svg path {
    fill: #f1175d;
  }
</style>
