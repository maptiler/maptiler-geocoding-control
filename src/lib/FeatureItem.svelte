<script lang="ts">
  import type { Feature } from "./types";

  export let feature: Feature;
  export let selected = false;
  export let showPlaceType = false;
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<li tabindex="0" data-selected={selected} class:selected on:mouseenter on:focus>
  <!-- <MarkerIcon displayIn="list" /> -->
  <span class="texts">
    <span>
      <span class="primary">
        {feature.place_name.replace(/,.*/, "")}
      </span>

      <span class="secondary">
        {feature.place_name.replace(/[^,]*,?\s*/, "")}
      </span>
    </span>

    {#if showPlaceType}
      <span class="line2">
        {feature.properties?.place_type_name?.[0] ?? feature.place_type[0]}
      </span>
    {/if}
  </span>
</li>

<style lang="scss">
  li {
    text-align: left;
    cursor: default;
    display: grid;
    grid-template-columns: 1fr;
    color: var(--color-text);
    padding: 8px 0px;
    font-size: 14px;
    line-height: 18px;

    &:first-child {
      padding-top: 10px;
    }

    &:last-child {
      padding-bottom: 10px;
    }

    &.selected {
      background-color: #f3f6ff;

      & .texts > * {
        animation: backAndForth 5s linear infinite;
      }

      & .primary {
        color: #2b8bfb;
      }
    }
  }

  .texts {
    padding: 0 17px;

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
      transform: translateX(calc(-100% + 236px));
    }
    55% {
      transform: translateX(calc(-100% + 236px));
    }
    90% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(0);
    }
  }
</style>
