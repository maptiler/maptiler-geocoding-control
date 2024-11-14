<script lang="ts">
  import { onMount } from "svelte";
  import { GeocodingControl } from "../../src/vanilla";

  let containerElement: HTMLElement;

  const apiKey =
    import.meta.env.VITE_API_KEY ||
    prompt("Please provide your MapTiler API key") ||
    "";

  onMount(() => {
    const geocodingControl = new GeocodingControl({
      apiKey,
      enableReverse: "always",
      // collapsed: true,
      iconsBaseUrl: "/icons/",
      target: containerElement,
    });

    geocodingControl.addEventListener("response", (e) => {
      console.log(e);
    });
  });
</script>

<main id="main" bind:this={containerElement} />
