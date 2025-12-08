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

# MapTiler Search and Geocoding control for MapTiler SDK, MapLibre GL JS, Leaflet and OpenLayers

## What?

The _MapTiler Geocoding control_ implements a powerful search box in your maps or online forms, enabling your application users to find any place on Earth down to individual addresses. Use the search box control with [MapTiler SDK JS](https://docs.maptiler.com/sdk-js/) (or other map libraries like [Leaflet](https://docs.maptiler.com/leaflet/), [MapLibre GL JS](https://github.com/maplibre/maplibre-gl-js), [OpenLayers](https://docs.maptiler.com/openlayers/)).

> ⚠️ _MapTiler Geocoding control_ v3 support for _Leaflet_ (v1 and v2) and _OpenLayers_ is to be added soon. In the meantime, please use _MapTiler Geocoding control_ v2 with these map libraries.

## Why?

The _Geocoding control_ uses the [MapTiler Geocoding API](https://www.maptiler.com/cloud/geocoding/). You can use the API directly from your web or backend applications or use the [API Client JS](https://docs.maptiler.com/client-js/) library.

With this control, users of mapping application can:

- Find any place on Earth (States, Cities, Streets, Addresses, POIs, ...) down to the address level
- Find and identify objects or place names using a coordinate pair or a single mouse click (reverse geocoding)
- Restrict the search area to a specific country, bounding box, or proximity
- Highlight searched results on the map (marker or full geometry)
- Autocomplete words while typing
- and much more. Check out the [Geocoding Control API reference](https://docs.maptiler.com/sdk-js/modules/geocoding/api/api-reference/#options) to see all the options.

The component can be used as an ES module or UMD module with or without bundler.

Geocoding control itself is provided as a [Web component](https://developer.mozilla.org/en-US/docs/Web/API/Web_components) which can be used with [React](https://docs.maptiler.com/sdk-js/modules/geocoding/api/usage/react/), [Svelte](https://docs.maptiler.com/sdk-js/modules/geocoding/api/usage/svelte/), and any other modern frontend library, or without any library at all.

## Install

Install the Geocoding control unsing `npm`, together with your map library (MapTiler SDK as an example):

```shell
npm install --save @maptiler/geocoding-control @maptiler/sdk
```

## Quick start

Use the component in your mapping application (MapTiler SDK as an example):

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

- [As a standalone Geocoding component](https://docs.maptiler.com/sdk-js/modules/geocoding/api/usage/standalone/) _(to be updated for v3)_
- [With MapTiler SDK](https://docs.maptiler.com/sdk-js/modules/geocoding/api/usage/sdk-js/) _(to be updated for v3)_
- [With MapLibre GL](https://docs.maptiler.com/sdk-js/modules/geocoding/api/usage/maplibre-gl-js/) _(to be updated for v3)_
- [With Leaflet](https://docs.maptiler.com/sdk-js/modules/geocoding/api/usage/leaflet/) _(to be updated for v3)_
- [With OpenLayers](https://docs.maptiler.com/sdk-js/modules/geocoding/api/usage/openlayers/) _(to be updated for v3)_
- [As a React component](https://docs.maptiler.com/sdk-js/modules/geocoding/api/usage/react/) _(to be updated for v3)_
- [As Svelte component](https://docs.maptiler.com/sdk-js/modules/geocoding/api/usage/svelte/) _(to be updated for v3)_
- [As vanilla JavaScript module](https://docs.maptiler.com/sdk-js/modules/geocoding/api/usage/vanilla-js/) _(to be updated for v3)_

## API Documentation

In addition to the details and examples provided in this `README.md` and our documentation, check out

- [The complete Geocoding service API documentation](https://docs.maptiler.com/cloud/api/geocoding/)
- [The complete Geocoding control reference](https://docs.maptiler.com/sdk-js/modules/geocoding/api/api-reference/) _(to be updated for v3)_
- [UMD global variables](https://docs.maptiler.com/sdk-js/modules/geocoding/#umd-global-variables) _(to be updated for v3)_

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

Alternatively, you can provide your API key via `key` URL param.

### POI icons and bundlers

POI icons are served from CDN per default. If there is an requirement to serve them from a different location and the control is used in the application which is built with Web Application bundler (like Webpack or Vite) then it is necessary to do some extra configuration. Icons are bundled in the library and you can find them in `node_modules/@maptiler/geocoding-control/icons`. Configure your bundler and/or provide `iconsBaseUrl` option for the icons to be properly resolved. You can also copy icons from that directory to your `public` directory.
