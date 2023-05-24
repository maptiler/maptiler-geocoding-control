# MapTiler Geocoding control for MapTiler SDK, MapLibre GL JS and Leaflet

A geocoding control for [MapTiler SDK](https://github.com/maptiler/maptiler-sdk-js), [MapLibre GL JS](https://github.com/maplibre/maplibre-gl-js) and [Leaflet](https://leafletjs.com) utilizes [MapTiler Cloud Geocoding API](https://www.maptiler.com/cloud/geocoding/). With this control, users of your application can find any place on Earth (States, Cities, Streets, ...) down to the address level, restrict the search area to a specific country, highlight searched results on the map, autocomplete words while typing, and much more.

The component can be used as an ES module or UMD module.

Geocoding control is also provided as [React component](#react-component) and a [Svelte component](#svelte-component).

## Usage

### Example for MapTiler SDK using module bundler

```
npm install --save @maptiler/geocoding-control @maptiler/sdk
```

```js
import * as maptilersdk from "@maptiler/sdk";
import { GeocodingControl } from "@maptiler/geocoding-control/maptilersdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";
import "@maptiler/geocoding-control/style.css";

maptilersdk.config.apiKey = "YOUR_MAPTILER_API_KEY_HERE";

const map = new maptilersdk.Map({
  container: "map", // id of HTML container element
});

const gc = new GeocodingControl();

map.addControl(gc);
```

### Example for MapLibre GL JS using module bundler

```bash
npm install --save @maptiler/geocoding-control maplibre-gl
```

```js
import maplibregl from "maplibre-gl";
import { GeocodingControl } from "@maptiler/geocoding-control/maplibregl";
import "@maptiler/geocoding-control/style.css";
import "maplibre-gl/dist/maplibre-gl.css";

const apiKey = "YOUR_MAPTILER_API_KEY_HERE";

const map = new maplibregl.Map({
  container: "map", // id of HTML container element
  style: "https://api.maptiler.com/maps/streets/style.json?key=" + apiKey,
  center: [16.3, 49.2],
  zoom: 7,
});

const gc = new GeocodingControl({ apiKey, maplibregl });

map.addControl(gc);
```

### Example for Leaflet using module bundler

```bash
npm install --save @maptiler/geocoding-control leaflet
```

```js
import * as L from "leaflet";
import { GeocodingControl } from "@maptiler/geocoding-control/leaflet";
import "@maptiler/geocoding-control/style.css";

const apiKey = "YOUR_MAPTILER_API_KEY_HERE";

const map = L.map(document.getElementById("map")).setView([49.2, 16.3], 6);

const scale = devicePixelRatio > 1.5 ? "@2x" : "";

L.tileLayer(
  `https://api.maptiler.com/maps/streets/{z}/{x}/{y}${scale}.png?key=` + apiKey,
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

L.control.maptilerGeocoding({ apiKey }).addTo(map);
```

For examples without using bundler see `demo-maplibregl.html` or `demo-leaflet.html`. After building this library (`npm install && npm run build`) you can open it in the browser:

- MapLibre GL JS: `sensible-browser file://$(pwd)/demo-maplibregl.html#key=YOUR_MAPTILER_API_KEY_HERE`
- Leaflet: `sensible-browser file://$(pwd)/demo-leaflet.html#key=YOUR_MAPTILER_API_KEY_HERE`

## API Documentation

### Options

- `apiKey`<sup>\*</sup>: `string` - Maptiler API key. Not needed if used with MapTiler SDK.
- `maplibregl`: `MapLibreGL` - A MapLibre GL JS instance to use when creating [Markers](https://maplibre.org/maplibre-gl-js-docs/api/markers/#marker). Used if `options.marker` is `true` with MapLibre GL JS library. If not provided it will be autodetected. Not needed if used with MapTiler SDK.
- `debounceSearch`: `number` - Sets the amount of time, in milliseconds, to wait before querying the server when a user types into the Geocoder input box. This parameter may be useful for reducing the total number of API calls made for a single query. Default `200`.
- `proximity`: `[number, number]` - A proximity argument: this is a geographical point given as an object with latitude and longitude properties. Search results closer to this point will be given higher priority.
- `placeholder`: `string` - Override the default placeholder attribute value. Default `"Search"`.
- `errorMessage`: `string` - Override the default error message. Default `"Something went wrong…"`.
- `noResultsMessage`: `string` - Override the default message if no results are found. Default `"Oops! Looks like you're trying to predict something that's not quite right. We can't seem to find what you're looking for. Maybe try double-checking your spelling or try a different search term. Keep on typing - we'll do our best to get you where you need to go!"`.
- `trackProximity`: `boolean` - If true, the geocoder proximity will automatically update based on the map view. Default `true`.
- `minLength`: `number` - Minimum number of characters to enter for results to show. Default `2`.
- `bbox`: `[number, number, number, number]` - A bounding box argument: this is a bounding box given as an array in the format [minX, minY, maxX, maxY]. Search results will be limited to the bounding box.
- `language`: `string | string[]` - Specify the language(s) to use for response text and query result weighting. Options are IETF language tags comprised of a mandatory ISO 639-1 language code and optionally one or more IETF subtags for country or script. More than one value can also be specified, separated by commas. Set to empty string or empty array for forcing no language preference. If this parameter is not provided at all the browser's language settings will be used.
- `showResultsWhileTyping`: `boolean` - If `false`, indicates that search will only occur on enter key press. If `true`, indicates that the Geocoder will search on the input box being updated above the minLength option. Default `false`.
- `marker`: `boolean | MarkerOptions` - If `true`, a [MapLibre GL JS Marker](https://maplibre.org/maplibre-gl-js-docs/api/markers/#marker) / [Leaflet Marker](https://leafletjs.com/reference.html#marker) will be added to the map at the location of the user-selected result using a default set of Marker options. If the value is an object, the marker will be constructed using these options. If `false`, no marker will be added to the map. Requires that `options.maplibregl` also be set. Default `true`.
- `showResultMarkers`: `boolean | MarkerOptions` - If `true`, [MapLibre GL JS Marker](https://maplibre.org/maplibre-gl-js-docs/api/markers/#marker) / [Leaflet Marker](https://leafletjs.com/reference.html#marker) will be added to the map at the location the top results for the query. If the value is an object, the marker will be constructed using these options. If `false`, no marker will be added to the map. Requires that `options.maplibregl` also be set. Default `true`.
- `zoom`: `number` - On geocoded result what zoom level should the map animate to when a bbox isn't found in the response. If a bbox is found the map will fit to the bbox. Default `16`.
- `flyTo`: `boolean | (FlyToOptions & FitBoundsOptions)` - If `false`, animating the map to a selected result is disabled. If `true`, animating the map will use the default animation parameters. If an object, it will be passed as options to the map `flyTo` or `fitBounds` method providing control over the animation of the transition. Default `true`.
- `collapsed`: `boolean` - If `true`, the geocoder control will collapse until hovered or in focus. Default `false`.
- `clearOnBlur`: `boolean` - If true, the geocoder control will clear its value when the input blurs. Default `false`.
- `filter`: `(feature: Feature) => boolean` - A function which accepts a Feature in the Carmen GeoJSON format to filter out results from the Geocoding API response before they are included in the suggestions list. Return true to keep the item, false otherwise.
- `class`: `string` - Class of the root element.
- `enableReverse`: `boolean | "always""` - Set to `true` to enable reverse geocoding button with title. Set to `"always"` to reverse geocoding be always active. Default `false`.
- `reverseButtonTitle`: `string` - Reverse toggle button title. Default `"toggle reverse geocoding"`.
- `clearButtonTitle`: `string` - Clear button title. Default `"clear"`.
- `showFullGeometry`: `boolean` - Set to `true` to show full feature geometry of the chosen result. Otherwise only marker will be shown. Default `true`.
- `fullGeometryStyle`: `{ fill: Pick<FillLayerSpecification, "layout" | "paint" | "filter">; line: Pick<LineLayerSpecification, "layout" | "paint" | "filter">; } | (L.PathOptions | L.StyleFunction)` - style of the full feature geometry. See Mapplibre GL JS or Leaflet documentation.
- `fuzzyMatch`: `boolean` - Set to `false` to disable fuzzy search. Default `true`.
- `limit`: `number` - Maximum number of results to show. Default `5`.
- `country`: `string | string[]` - Limit search to specified country(ies). Default `undefined` (use all countries). Specify as [alpha-2 ISO 3166](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) lowercase code.
- `types`: `string[]` - Filter of feature types to return. Default `undefined` (all available feature types are returned).

### Methods

- `setQuery(value: string, submit = true): void` - set the query and optionally submit it
- `focus(): void` - focus the query input box
- `blur(): void` - blur the query input box
- `setReverseMode(value: boolean | "always"): void` - set reverse mode
- `setOptions(options: Partial<Options>): void` - change one or more options of existing control

### Events

Events are implemented using [EventTarget](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget) and [CustomEvent](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent).

- `select` - Fired on highlighting search result in the dropdown by hovering it or by keyboard selection. Event value will be set to the highlighted `Feature` or to `undefined` if nothing is highlighted.
- `pick` - Fired on picking the result from the dropdown. Event value will be set to the picked `Feature` or to `undefined` if nothing is picked (eg. search input is cleared).
- `optionsVisibilityChange` - Fired with `true` value if dropdown list appears, `false` if it disappears
- `featuresListed` - Fired after features are retrieved from the server. Event value contains list of features or `undefined`.
- `featuresMarked` - Fired after features are marked on the map. Event value contains list of features or `undefined`.
- `response` - Fired after HTTP response of the geocoding server. Event value contains object with requested `url` and responded `featureCollection`.
- `reverseToggle` - Fired if reverse geocoding button is toggled. Event value is `true` if reverse geocoding mode is active, otherwise `false`.
- `queryChange` - Fired if query was changed. Event value is the query string.

Example:

```javascript
geocodingControl.addEventListener("optionsVisibilityChange", (e) => {
  console.log("Options visible:", e.detail);
});
```

## React component

In addition to using the component as MapLibre GL JS or Leaflet Control it is also possible to use it stand-alone in React projects with or without MapLibre GL JS or Leaflet integration.

Component API matches API described above where options and events are exposed as component properties and methods are callable on the component reference.

### Example for integration with MapLibre GL JS

```typescript
import { useEffect, useRef, useState } from "react";
import { GeocodingControl } from "@maptiler/geocoding-control/react";
import { createMapLibreGlMapController } from "@maptiler/geocoding-control/maplibregl-controller";
import type { MapController } from "@maptiler/geocoding-control/types";
import "@maptiler/geocoding-control/style.css";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export function App() {
  const apiKey = "YOUR_MAPTILER_API_KEY_HERE";

  const mapContainerRef = useRef<HTMLDivElement>(null);

  const [mapController, setMapController] = useState<MapController>();

  useEffect(() => {
    if (!mapContainerRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      style: "https://api.maptiler.com/maps/streets/style.json?key=" + apiKey,
      container: mapContainerRef.current,
    });

    setMapController(createMapLibreGlMapController(map, maplibregl));
  }, []);

  return (
    <div>
      <GeocodingControl apiKey={apiKey} mapController={mapController} />

      <div
        ref={mapContainerRef}
        style={{ width: "800px", height: "600px", marginTop: "8px" }}
      />
    </div>
  );
}
```

## Svelte component

In addition to using the component as MapLibre GL JS or Leaflet Control it is also possible to use it stand-alone in Svelte projects with or without MapLibre GL JS or Leaflet integration.

Component API matches API described above where options and events are exposed as component properties and methods are callable on the component reference.

### Example for integration with MapLibre GL JS

```svelte
<script lang="ts">
  import GeocodingControl from "@maptiler/geocoding-control/GeocodingControl.svelte";
  import { createMapLibreGlMapController } from "@maptiler/geocoding-control/maplibregl";
  import type { MapController } from "@maptiler/geocoding-control/types";
  import maplibregl from "maplibre-gl";
  import "maplibre-gl/dist/maplibre-gl.css";

  const apiKey = "YOUR_MAPTILER_API_KEY_HERE";

  let mapController: MapController;

  let container: HTMLElement;

  onMount(() => {
    const map = new maplibregl.Map({
      style: "https://api.maptiler.com/maps/streets/style.json?key=" + apiKey,
      container,
    });

    mapController = createMapLibreGlMapController(map, maplibregl);
  });
</script>

<div class="map" bind:this={container} />

{#if mapController}
  <GeocodingControl {mapController} {apiKey} {maplibregl} />
{/if}

<style>
  .map {
    position: absolute;
    inset: 0;
  }
</style>
```

## Building

```bash
npm install && npm run build
```

You will find compilation result in `dist` directory.

## Running in dev mode

```bash
npm install && VITE_API_KEY=YOUR_MAPTILER_API_KEY_HERE npm run dev
```
