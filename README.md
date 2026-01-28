<img src="https://raw.githubusercontent.com/maptiler/maptiler-sdk-kotlin/main/Examples/maptiler-logo.png" alt="Company Logo" height="32"/>

# MapTiler Search and Geocoding control for MapTiler SDK, MapLibre GL JS, Leaflet and OpenLayers

The Javascript & TypeScript Map Control component for <a href="https://www.maptiler.com/cloud/geocoding">MapTiler Geocoding</a> service! Easy to be integrated into any JavaScript mapping application.

The _MapTiler Geocoding control_ implements a powerful search box in your maps or online forms, enabling your application users to find any place on Earth down to individual addresses. Use the search box control with [MapTiler SDK JS](https://docs.maptiler.com/sdk-js/) (or other map libraries like [Leaflet](https://docs.maptiler.com/leaflet/), [MapLibre GL JS](https://github.com/maplibre/maplibre-gl-js), [OpenLayers](https://docs.maptiler.com/openlayers/)).

> ⚠️ _MapTiler Geocoding control_ v3 support for _Leaflet_ (v1 and v2) and _OpenLayers_ is to be added soon. In the meantime, please use _MapTiler Geocoding control_ v2 with these map libraries.

[![](https://img.shields.io/npm/v/@maptiler/geocoding-control?style=for-the-badge&labelColor=D3DBEC&color=f2f6ff&logo=npm&logoColor=333359)](https://www.npmjs.com/package/@maptiler/geocoding-control)
![](https://img.shields.io/badge/-white?style=for-the-badge&logo=javascript)![](https://img.shields.io/badge/-white?style=for-the-badge&logo=typescript)![](https://img.shields.io/badge/-white?style=for-the-badge&logo=react&logoColor=61dafb)![](https://img.shields.io/badge/-white?style=for-the-badge&logo=svelte&logoColor=FF3E00)

---

📖 [Documentation](https://docs.maptiler.com/sdk-js/modules/geocoding/) &nbsp; 📦 [NPM Package](https://www.npmjs.com/package/@maptiler/geocoding-control) &nbsp; 🌐 [Website](https://www.maptiler.com/search/) &nbsp; 🔑 [Get API Key](https://cloud.maptiler.com/account/keys/)

---

<br>

<details> <summary><b>Table of Contents</b></summary>
<ul>
<li><a href="#-installation">Installation</a></li>
<li><a href="#-basic-usage">Basic Usage</a></li>
<li><a href="#-related-examples">Examples</a></li>
<li><a href="#-api-reference">API Reference</a></li>
<li><a href="#migration-guide">Migration Guide</a></li>
<li><a href="#-support">Support</a></li>
<li><a href="#-contributing">Contributing</a></li>
<li><a href="#-license">License</a></li>
<li><a href="#-acknowledgements">Acknowledgements</a></li>
</ul>
</details>

<p align="center">   <img src="https://www.metalocator.com/wp-content/uploads/2022/07/maptiler-cloud-jp.jpg" alt="Demo Screenshot" width="80%"/>  <br />  <a href="#">See live interactive demo</a> </p>
<br>

## 📦 Installation

Install the Geocoding control unsing `npm`, together with your map library (MapTiler SDK as an example):

```shell
npm install --save @maptiler/geocoding-control @maptiler/sdk
```

<br>

## 🚀 Basic Usage

Use the component in your mapping application (MapTiler SDK as an example):

```js
import * as maptilersdk from "@maptiler/sdk";
import { GeocodingControl } from "@maptiler/geocoding-control/maptilersdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";

maptilersdk.config.apiKey = "YOUR_MAPTILER_API_KEY_HERE";

const map = new maptilersdk.Map({
  container: "map", // id of HTML container element
});

const gc = new GeocodingControl();

map.addControl(gc);
```

<br>

## 💡 Related Examples

- [With MapTiler SDK](https://docs.maptiler.com/sdk-js/modules/geocoding/api/usage/sdk-js/)
- [With MapLibre GL](https://docs.maptiler.com/sdk-js/modules/geocoding/api/usage/maplibre-gl-js/)
- [With Leaflet](https://docs.maptiler.com/sdk-js/modules/geocoding/api/usage/leaflet/)
- [With OpenLayers](https://docs.maptiler.com/sdk-js/modules/geocoding/api/usage/openlayers/)
- [As a React component](https://docs.maptiler.com/sdk-js/modules/geocoding/api/usage/react/)
- [As Svelte component](https://docs.maptiler.com/sdk-js/modules/geocoding/api/usage/svelte/)
- [As vanilla JavaScript module](https://docs.maptiler.com/sdk-js/modules/geocoding/api/usage/vanilla-js/)

Check out the full list of [MapTiler geocoding examples](https://docs.maptiler.com/sdk-js/examples/?q=geocoding)

<br>

## 📘 API Reference

For detailed guides, API reference, and advanced examples, visit our comprehensive documentation:

[API documentation](https://docs.maptiler.com/sdk-js/modules/geocoding/api/api-reference/)

[Geocoding service API documentation](https://docs.maptiler.com/cloud/api/geocoding/)

[UMD global variables](https://docs.maptiler.com/sdk-js/modules/geocoding/#umd-global-variables)

<br>

## 💬 Support

- 📚 [Documentation](https://docs.maptiler.com/sdk-js/modules/geocoding/) - Comprehensive guides and API reference
- ✉️ [Contact us](https://maptiler.com/contact) - Get in touch or submit a request
- 🐦 [Twitter/X](https://twitter.com/maptiler) - Follow us for updates

<br>

---

<br>

## 🤝 Contributing

We love contributions from the community! Whether it's bug reports, feature requests, or pull requests, all contributions are welcome:

- Fork the repository and create your branch from `main`
- If you've added code, add tests that cover your changes
- Ensure your code follows our style guidelines
- Give your pull request a clear, descriptive summary
- Open a Pull Request with a comprehensive description
- Read the [CONTRIBUTING](./CONTRIBUTING.md) file

### Development

#### Building

```bash
npm install && npm run build
```

You will find compilation result in the `dist` directory.

#### Running in dev mode

```bash
npm install && VITE_API_KEY=YOUR_MAPTILER_API_KEY_HERE npm run dev
```

Alternatively, you can provide your API key via `key` URL param.

### POI icons and bundlers

POI icons are served from CDN per default. If there is an requirement to serve them from a different location and the control is used in the application which is built with Web Application bundler (like Webpack or Vite) then it is necessary to do some extra configuration. Icons are bundled in the library and you can find them in `node_modules/@maptiler/geocoding-control/icons`. Configure your bundler and/or provide `iconsBaseUrl` option for the icons to be properly resolved. You can also copy icons from that directory to your `public` directory.

<br>

## 📄 License

This project is licensed under the BSD 3-Clause License – see the [LICENSE](./LICENSE) file for details.

<br>

## 🙏 Acknowledgements

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

<br>

<p align="center" style="margin-top:20px;margin-bottom:20px;"> <a href="https://cloud.maptiler.com/account/keys/" style="display:inline-block;padding:12px 32px;background:#F2F6FF;color:#000;font-weight:bold;border-radius:6px;text-decoration:none;"> Get Your API Key <sup style="background-color:#0000ff;color:#fff;padding:2px 6px;font-size:12px;border-radius:3px;">FREE</sup><br /> <span style="font-size:90%;font-weight:400;">Start building with 100,000 free map loads per month ・ No credit card required.</span> </a> </p>

<br>

<p align="center"> 💜 Made with love by the <a href="https://www.maptiler.com/">MapTiler</a> team <br />
<p align="center">
  <a href="https://www.maptiler.com/search/">Website</a> •
  <a href="https://docs.maptiler.com/sdk-js/modules/geocoding/">Documentation</a> •
  <a href="https://github.com/maptiler/maptiler-geocoding-control">GitHub</a>
</p>
