# MapTiler Geocoder control for Maplibre GL JS

A geocoder control for [maplibre-gl-js](https://github.com/maplibre/maplibre-gl-js).

## Usage

### Usage with a module bundler

```bash
npm install --save @maptiler/maplibre-gl-maptiler-geocoder maplibre-gl
```

```js
import maplibregl from "maplibre-gl";
import MaplibreGeocoder from "@maptiler/maplibre-gl-maptiler-geocoder";
import "@maptiler/maplibre-gl-maptiler-geocoder/dist/style.css";

const API_KEY = "your API key";

const map = new maplibregl.Map({
  container: "map", // id of HTML container element
  style: "https://api.maptiler.com/maps/streets/style.json?key=" + API_KEY,
  center: [16.3, 49.2],
  zoom: 7,
});

const gc = new maptilerGeocoding.GeocodingControl({
  apiKey: API_KEY,
  maplibregl,
});
```

## API Documentation

Options:

- `apiKey`<sup>\*</sup>: `string` - Maptiler API key
- `maplibregl`: `MapLibreGL` - A Maplibre GL instance to use when creating [Markers](https://maplibre.org/maplibre-gl-js-docs/api/markers/#marker). Required if `options.marker` is `true`.
- `debounceSearch`: `number` - Sets the amount of time, in milliseconds, to wait before querying the server when a user types into the Geocoder input box. This parameter may be useful for reducing the total number of API calls made for a single query. Default `200`.
- `proximity`: `[number, number]` - A proximity argument: this is a geographical point given as an object with latitude and longitude properties. Search results closer to this point will be given higher priority.
- `placeholder`: `string` - Override the default placeholder attribute value. Default `"Search"`.
- `errorMessage`: `string` - Override the default error message. Default `"Searching failed"`.
- `trackProximity`: `boolean` - If true, the geocoder proximity will automatically update based on the map view. Default `true`.
- `minLength`: `number` - Minimum number of characters to enter before results are shown. Default `2`.
- `bbox`: `number` - A bounding box argument: this is a bounding box given as an array in the format [minX, minY, maxX, maxY]. Search results will be limited to the bounding box.
- `limit`: `number` - Maximum number of results to show. Default `5`.
- `language`: `string` - Specify the language to use for response text and query result weighting. Options are IETF language tags comprised of a mandatory ISO 639-1 language code and optionally one or more IETF subtags for country or script. More than one value can also be specified, separated by commas. Defaults to the browser's language settings.
- `showResultsWhileTyping`: `boolean` - If `false`, indicates that search will only occur on enter key press. If `true`, indicates that the Geocoder will search on the input box being updated above the minLength option. Default `false`.
- `marker`: `boolean | MarkerOptions` - If `true`, a [Marker](https://maplibre.org/maplibre-gl-js-docs/api/markers/#marker) will be added to the map at the location of the user-selected result using a default set of Marker options. If the value is an object, the marker will be constructed using these options. If `false`, no marker will be added to the map. Requires that `options.maplibregl` also be set. Default `true`.
- `showResultMarkers`: `boolean | MarkerOptions` - If `true`, [Markers](https://maplibre.org/maplibre-gl-js-docs/api/markers/#marker) will be added to the map at the location the top results for the query. If the value is an object, the marker will be constructed using these options. If `false`, no marker will be added to the map. Requires that `options.maplibregl` also be set. Default `true`.
- `zoom`: `number` - On geocoded result what zoom level should the map animate to when a bbox isn't found in the response. If a bbox is found the map will fit to the bbox. Default `16`.
- `flyTo`: `boolean | (FlyToOptions & FitBoundsOptions)` - If `false`, animating the map to a selected result is disabled. If `true`, animating the map will use the default animation parameters. If an object, it will be passed as options to the map `flyTo` or `fitBounds` method providing control over the animation of the transition. Default `true`.
- `collapsed`: `boolean` - If `true`, the geocoder control will collapse until hovered or in focus. Default `false`.

## Building

```bash
npm install && npm run build
```

You will find compilation result in `dist` directory.

## Running in dev mode

```bash
npm install && npm run dev
```
