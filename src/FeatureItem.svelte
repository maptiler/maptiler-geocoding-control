<script lang="ts">
  import type { Feature } from "./types";

  export let feature: Feature;

  export let selected = false;

  export let showPlaceType: false | "always" | "ifNeeded";

  export let missingIconsCache: Set<string>;

  export let iconsBaseUrl: string;

  const categories = feature.properties?.categories;

  let category: string | undefined;

  let imageUrl: string | undefined;

  let loadIconAttempt = 0;

  $: index = categories?.length ?? 0;

  $: {
    loadIconAttempt;

    do {
      index--;

      category = categories?.[index];

      imageUrl = category
        ? iconsBaseUrl + category.replace(/ /g, "_") + ".svg"
        : undefined;
    } while (index > -1 && (!imageUrl || missingIconsCache.has(imageUrl)));
  }

  $: placeType = feature.id.startsWith("poi.")
    ? feature.properties?.categories?.join(", ")
    : feature.properties?.place_type_name?.[0] ?? feature.place_type[0];

  function handleImgError(e: Element) {
    if (imageUrl) {
      missingIconsCache.add(imageUrl);
    }

    loadIconAttempt++;
  }
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<li tabindex="0" data-selected={selected} class:selected on:mouseenter on:focus>
  {#if imageUrl}
    <img
      src={imageUrl}
      alt={category}
      on:error={(e) => handleImgError(e.currentTarget)}
    />
  {:else if feature.address}
    <img src={iconsBaseUrl + "housenumber.svg"} alt={placeType} />
  {:else if feature.properties?.kind === "road" || feature.properties?.kind === "road_relation"}
    <img src={iconsBaseUrl + "road.svg"} alt={placeType} />
  {:else if feature.id.startsWith("address.")}
    <img src={iconsBaseUrl + "street.svg"} alt={placeType} />
  {:else if feature.id.startsWith("postal_code.")}
    <img src={iconsBaseUrl + "postal_code.svg"} alt={placeType} />
  {:else if feature.id.startsWith("poi.")}
    <img src={iconsBaseUrl + "poi.svg"} alt={placeType} />
  {:else}
    <img src={iconsBaseUrl + "area.svg"} alt={placeType} />
  {/if}

  <span class="texts">
    <span>
      <span class="primary">
        {feature.place_name.replace(/,.*/, "")}
      </span>

      {#if showPlaceType === "always" || (showPlaceType && !feature.address && feature.properties?.kind !== "road" && feature.properties?.kind !== "road_relation" && !feature.id.startsWith("address.") && !feature.id.startsWith("postal_code.") && (!feature.id.startsWith("poi.") || !imageUrl))}
        <span class="secondary">
          {placeType}
        </span>
      {/if}
    </span>

    <span class="line2">
      {feature.place_name.replace(/[^,]*,?\s*/, "")}
    </span>
  </span>
</li>

<style lang="scss">
  li {
    text-align: left;
    cursor: default;
    display: grid;
    grid-template-columns: 40px 1fr;
    color: var(--color-text);
    padding: 8px 0px;
    font-size: 14px;
    line-height: 18px;
    min-width: fit-content;

    &:first-child {
      padding-top: 10px;
    }

    &:last-child {
      padding-bottom: 10px;
    }

    &.selected {
      background-color: #f3f6ff;

      & {
        animation: backAndForth 5s linear infinite;
      }

      & .primary {
        color: #2b8bfb;
      }
    }

    & > img {
      align-self: center;
      justify-self: center;
      opacity: 0.75;
    }
  }

  .texts {
    padding: 0 17px 0 0;

    & > * {
      white-space: nowrap;
      display: block;
      min-width: fit-content;
    }
  }

  .primary {
    font-weight: 600;
  }

  .secondary {
    color: #aeb6c7;
    padding-left: 4px;
  }

  .line2 {
    color: #aeb6c7;
  }

  @keyframes backAndForth {
    0% {
      transform: translateX(0);
    }
    10% {
      transform: translateX(0);
    }
    45% {
      transform: translateX(calc(-100% + 270px));
    }
    55% {
      transform: translateX(calc(-100% + 270px));
    }
    90% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(0);
    }
  }
</style>
