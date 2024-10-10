<p align="center">
<a href="https://www.maptiler.com/cloud/geocoding/">official page →</a><br>
  <img src="images/maptiler-logo.svg" width="350px">
</p>

<p align="center" style="color: #AAA">
  The Javascript & TypeScript Map Control component for <a href="https://www.maptiler.com/cloud/geocoding">MapTiler Geocoding</a> service! Easy to be integrated into any JavaScript mapping application.
</p>

<p align="center">
  <img src="images/JS-logo.svg" width="20px">
  <img src="images/TS-logo.svg" width="20px">
  <img src="images/react-logo.svg" width="20px">
  <img src="images/svelte-logo.svg" width="20px">
  <img src="https://img.shields.io/npm/v/@maptiler/geocoding-control"></img>
  <img src="https://img.shields.io/twitter/follow/maptiler?style=social"></img>
</p>

# MapTiler Geocoding control for MapTiler SDK, MapLibre GL JS, Leaflet and OpenLayers

## About

A _Geocoding control_ for [MapTiler SDK](https://github.com/maptiler/maptiler-sdk-js),
[MapLibre GL JS](https://github.com/maplibre/maplibre-gl-js),
[Leaflet](https://leafletjs.com) and [OpenLayers](https://openlayers.org) utilizes [MapTiler Cloud Geocoding
API](https://www.maptiler.com/cloud/geocoding/). With this control, users of
mapping application can find any place on Earth (States, Cities, Streets, Addresses, POIs, ...) down
to the address level, restrict the search area to a specific country, highlight
searched results on the map, autocomplete words while typing, and much more.

The component can be used as an ES module or UMD module with or without bundler.

Geocoding control is also provided as [React component](https://docs.maptiler.com/sdk-js/modules/geocoding/api/usage/react/) and [Svelte component](https://docs.maptiler.com/sdk-js/modules/geocoding/api/usage/svelte/) and [other libraries](#installation-and-more-usage-examples).

## Quick start

Install the Geocoding control unsing `npm`:

```shell
npm install --save @maptiler/geocoding-control @maptiler/sdk
```

Use the component in your mapping application:

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

NOTE: Get your personal [MapTiler API key](https://docs.maptiler.com/cloud/api/authentication-key/) in the [MapTiler Cloud](https://cloud.maptiler.com).

## Installation and more usage examples

- [With MapTiler SDK](https://docs.maptiler.com/sdk-js/modules/geocoding/api/usage/sdk-js/)
- [With MapLibre GL](https://docs.maptiler.com/sdk-js/modules/geocoding/api/usage/maplibre-gl-js/)
- [With Leaflet](https://docs.maptiler.com/sdk-js/modules/geocoding/api/usage/leaflet/)
- [With OpenLayers](https://docs.maptiler.com/sdk-js/modules/geocoding/api/usage/openlayers/)
- [As a React component](https://docs.maptiler.com/sdk-js/modules/geocoding/api/usage/react/)
- [As Svelte component](https://docs.maptiler.com/sdk-js/modules/geocoding/api/usage/svelte/)
- [As vanilla JavaScript module](https://docs.maptiler.com/sdk-js/modules/geocoding/api/usage/vanilla-js/)

## API Documentation

In addition to the details and examples provided in this `README.md` and our documentation, check out

- [The complete Geocoding service API documentation](https://docs.maptiler.com/cloud/api/geocoding/)
- [The complete Geocoding control reference](https://docs.maptiler.com/sdk-js/modules/geocoding/api/api-reference/)
- [UMD global variables](https://docs.maptiler.com/sdk-js/modules/geocoding/#umd-global-variables)

## Development

### Building

```bash
npm install && npm run build
```

You will find compilation result in the `dist` directory.

### Running in dev mode

```bash
npm install && VITE_API_KEY=YOUR_MAPTILER_API_KEY_HERE npm run dev
```

### POI icons and bundlers

POI icons are served from CDN per default. If there is an requirement to serve them from a different location and the control is used in the application which is built with Web Application bundler (like Webpack or Vite) then it is necessary to do some extra configuration. Icons are bundled in the library and you can find them in `node_modules/@maptiler/geocoding-control/icons`. Configure your bundler and/or provide `iconsBaseUrl` option for the icons to be properly resolved. You can also copy icons from that directory to your `public` directory.
