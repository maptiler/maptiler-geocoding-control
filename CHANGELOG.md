# MapTiler Geocoding Control Changelog

## 4.0.0

### ⚠️ Breaking changes

- Allowed dependency versions of map libraries are updated. See [_Upgrading from v3 to v4_ in README](./README.md#upgrading-from-v3-to-v4).
  - standalone: unchanged (no particular map library needed)
  - MapLibre GL JS: v6
  - MapTiler SDK JS: v5
  - Leaflet: v2
  - OpenLayers: unchanged (v9.1 or v10)
- MapTiler SDK control:
  - Markers now use SDK's own `Marker` and are added to the map with `map.addMarker()`.
  - The `marker` and `showResultMarkers` options take SDK's marker options (`MapTilerMarkerElementOptions` or `MapTilerMarkerSVGOptions`), e.g. `outerColor` instead of `color` and `scale` as `[x, y]`.
  - The control no longer extends `MaplibreglGeocodingControl`. Instead, both controls share a base class.
- Removes the MapLibre GL JS UMD build `maplibregl.umd.js`. MapLibre GL JS 6 is published only as an ES module. Use the ES module build with a bundler, or MapTiler SDK JS, which has UMD and CDN builds.
- `require()` now loads the ES module builds. To use `require()` with this package, your Node.js should be 20.19+ or 22.12+.
- POI icons moved in the npm package from `dist/icons` to `icons`. This new path was always documented that way and icons being in `dist` was a v3 regression. The CDN location used by the default `iconsBaseUrl` is unchanged.
- The MapLibre GL JS and MapTiler SDK controls no longer extend MapLibre's `Evented` directly, instead use mixin pattern to combine classes. Methods of `Evented` work as before, but `control instanceof Evented` is now `false`.

### ✨ Features and improvements

- Adds `maptilersdk.cdn.mjs`, an ES module build of the MapTiler SDK control for the CDN, to use without a bundler. It bundles all dependencies except `@maptiler/sdk`, which user can map to the SDK's CDN ES module with an import map, so the page and the control share one SDK. See [_Without a bundler_ in README](./README.md#without-a-bundler).
- MapLibre GL JS and MapTiler SDK controls can be customized by subclasses with the protected methods `createMarker`, `addMarker`, `setMarkerPopup` and `adjustRequestUrl`.

### 🐛 Bug Fixes

- Fixes types under TypeScript `moduleResolution` `node16` and `nodenext` (#127). Relative imports in the type declarations now have `.js` extensions, and `export * from "."` is now `export * from "./index.js"`.
- Fixes loading the OpenLayers control in Node.js ES modules (e.g. server-side rendering or Vitest's Node environment), and its types under `node16` and `nodenext`. `ol` imports now use explicit file paths such as `ol/control.js` instead of directory imports.

### ⚙️ Others

- Adds the `./package.json` subpath export.
- Adds new dependency versions to type compatibility checks.
- Changes TypeScript config to target ES2022 and `moduleResolution: "bundler"`.

## 3.1.1

### 🐛 Bug Fixes

- Fixes MapTiler SDK control ignoring `session: false` and dropping `adjustUrl` option when API key is taken from the map, or after any later `setOptions()` calls.
- Fixes MapLibre GL JS control calling `setOptions()` from its constructor, before the fields of subclasses are initialized.
- Fixes `map-center` proximity rule and `minZoom` / `maxZoom` limits of proximity rules not working in Leaflet control.
- Fixes Leaflet peer dependency range due to breaking changes between v2 alpha and beta versions, it's now `>=1.5 <2.0.0-beta`. Leaflet v2 will be supported in next major version of this package.
- Fixes compatibility with types of OpenLayers 10.11 and newer, which declare that the map's target element can be null or undefined (as it could already be at runtime even in older versions before the map has a target).
- Fixes OpenLayers control leaving geometry (outline or mask) of a previously picked result on the map when another result was picked or the results were cleared.
- Fixes TypeScript types:
  - Type of the `<maptiler-geocoder>` element wasn't assignable to `HTMLElement` and `Node`, which broke the global `HTMLElementTagNameMap` with `skipLibCheck: false`. Its `addEventListener` and `removeEventListener` now also accept standard DOM events and any other event type.
  - `render()` return types of the web components referenced `lit-html`, which isn't a dependency of the package, so they didn't resolve with strict package managers.
  - Path to top-level `types` field in `package.json` was wrong so types were not found by older TypeScript and bundlers not supporting `exports` map.

## 3.1.0

### ✨ Features and improvements

- Adds webcomponent slots to allow content customization or replacement
- Adds webcomponent `::part()` support to allow better style customization
- Adds more CSS custom properties to allow better style customization

### 🐛 Bug Fixes

- Fixes bug where map would not fly to selected feature on mobile if `keepListOpen` is false (#116)
- Fixes loading spinner placement and colour (#122)
- Fixes changing width of component not changing width of container used for scrolling long text in feature list
- Fixes MapTiler SDK / MapLibre GL control removal logic (fixes proper React dev mode usage) (#115)
- Fixes search button which should not be tabbable as it is only a visual helper

**Full Changelog**: https://github.com/maptiler/maptiler-geocoding-control/compare/v3.0.0...v3.1.0

## 3.0.0

### ⚠️ Breaking changes

- Geocoding component has been rewritten as a Web Component and does not require Svelte anymore, public API changed significantly

### ✨ Features and improvements

- Geocoding Control is provided for several different map libraries as before, however Geocoding component can now also be used standalone on its own, allowing for integration in other systems than map-based ones
- Improved coordinates formatting when user searches for raw coordinates or when using reverse geocoding
- Adds support for Leaflet v2 (as per 2.0.0-alpha.1 prerelease version)
- Adds worldview option for geocoder that allows to set which worldview to use for geocoding searches
- Adds session-based geocoding to MapTiler SDK control
- Adds flyToFeatures option to control when to zoom to bounding box of result features

### 🐛 Bug Fixes

- Fixes peer dependency versions

### ⚙️ Others

- Adds type compatibility tests with supported libraries of various versions

**Full Changelog**: https://github.com/maptiler/maptiler-geocoding-control/compare/v2.1.7...v3.0.0

## 2.1.7

### What's Changed

- Removed condition that threw an error if no Cloud API was supplied, this only logs to console now. Types updated to match.
- Github Actions to allow for linting and release.

**Full Changelog**: https://github.com/maptiler/maptiler-geocoding-control/compare/v2.1.6...v2.1.7

## 2.1.6

### What's Changed

- fixed cleanup on control removal from MapLibre map by @zdila in https://github.com/maptiler/maptiler-geocoding-control/pull/85
- fixed not displaying center for multipoint by @zdila in https://github.com/maptiler/maptiler-geocoding-control/pull/86

**Full Changelog**: https://github.com/maptiler/maptiler-geocoding-control/compare/v2.1.4...v2.1.6

## 2.1.4

Fixed ReferenceError in SSR frameworks

**Full Changelog**: https://github.com/maptiler/maptiler-geocoding-control/compare/v2.1.3...v2.1.4

## 2.1.3

### What's Changed

- clear pick on input clear by @zdila in https://github.com/maptiler/maptiler-geocoding-control/pull/82
- replace licensed icons with sprite by @zdila in https://github.com/maptiler/maptiler-geocoding-control/pull/83

**Full Changelog**: https://github.com/maptiler/maptiler-geocoding-control/compare/v2.1.2...v2.1.3

## 2.1.2

### What's Changed

- Fixed *.d.ts path by @zdila in https://github.com/maptiler/maptiler-geocoding-control/pull/81

**Full Changelog**: https://github.com/maptiler/maptiler-geocoding-control/compare/v2.1.1...v2.1.2

## 2.1.1

### What's Changed

- Fixed doc of `reverseGeocodingLimit`, added backward compatibility of MapTiler SDK. by @zdila in https://github.com/maptiler/maptiler-geocoding-control/pull/80

**Full Changelog**: https://github.com/maptiler/maptiler-geocoding-control/compare/v2.1.0...v2.1.1

## 2.1.0

### What's Changed

- Add icon titles by @zdila in https://github.com/maptiler/maptiler-geocoding-control/pull/68
- Add focus options and `setReverseMode` by @zdila in https://github.com/maptiler/maptiler-geocoding-control/pull/69
- Added `adjustUrl` function by @zdila in https://github.com/maptiler/maptiler-geocoding-control/pull/71
- dependencies update by @zdila in https://github.com/maptiler/maptiler-geocoding-control/pull/74
- Add new and modified icons by @petraduriancikova in https://github.com/maptiler/maptiler-geocoding-control/pull/70
- Added `clearListOnPick` and `keepListOpen` options by @zdila in https://github.com/maptiler/maptiler-geocoding-control/pull/73
- Update MapTiler SDK to v3 & MapLibre to v5 by @sebstryczek in https://github.com/maptiler/maptiler-geocoding-control/pull/75
- implemented separate options for reverse geocoding by @zdila in https://github.com/maptiler/maptiler-geocoding-control/pull/79

**Full Changelog**: https://github.com/maptiler/maptiler-geocoding-control/compare/v2.0.1...v2.1.0

## 2.0.1

### What's Changed

- fixed proximity javadoc by @zdila in https://github.com/maptiler/maptiler-geocoding-control/pull/51
- fix margin in quirks mode by @zdila in https://github.com/maptiler/maptiler-geocoding-control/pull/52
- fixed TypeError by @zdila in https://github.com/maptiler/maptiler-geocoding-control/pull/53
- included map to react example by @zdila in https://github.com/maptiler/maptiler-geocoding-control/pull/54
- cleaned geocoding control events (fixes #49) by @zdila in https://github.com/maptiler/maptiler-geocoding-control/pull/55
- improved markers customization by @zdila in https://github.com/maptiler/maptiler-geocoding-control/pull/57
- fixed leaflet control position option (fixes #60) by @zdila in https://github.com/maptiler/maptiler-geocoding-control/pull/62
- Workaround to prevent collision with svelte-maplibre (fixes #59) by @zdila in https://github.com/maptiler/maptiler-geocoding-control/pull/63
- vendor compatible events by @zdila in https://github.com/maptiler/maptiler-geocoding-control/pull/61
- Implement way to display picked feature of polygon without a marker. by @zdila in https://github.com/maptiler/maptiler-geocoding-control/pull/64
- API cleanup for v2.0.0 by @zdila in https://github.com/maptiler/maptiler-geocoding-control/pull/65
- bumped version by @zdila in https://github.com/maptiler/maptiler-geocoding-control/pull/67

**Full Changelog**: https://github.com/maptiler/maptiler-geocoding-control/compare/v1.4.1...v2.0.1

### Breaking changes

- Events were reworked to be idiomatic per map library
  - Universal example for MapLibre GL, MapTiler SDK, Leaflet and Openlayers: `geocodingControl.on("featureslisted", (e) => console.log(e.features));`
  - For vanilla JS [EventTarget](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget) API is used. Example: `geocodingControl.addEventListener("response", (e) => console.log(e.detail.url));`
- `zoom` parameter must be now only `Record<string, number>` and not `number` which was already deprecated
- removed deprecated `maxZoom`
- For `showPlaceType` parameter, `false` has been replaced by with `"never"` and `"ifNeeded"` by `"if-needed"`
- Replaced parameter `showFullGeometry` with `pickedResultStyle` which is now default `"full-geometry"`. To keep old behavior use `"full-geometry-including-polygon-center-marker"` instead of `true` or `"marker-only"` instead of `false`.
- For `enableReverse` parameter, `false` has been replaced by `"never"`, `true` by `"button"`
- Advanced: Changed `MapController` interface

## 1.4.1

### What's Changed

- fixed dependencies section by @zdila in https://github.com/maptiler/maptiler-geocoding-control/pull/48

**Full Changelog**: https://github.com/maptiler/maptiler-geocoding-control/compare/v1.4.0...v1.4.1

## 1.4.0

### What's Changed

- Unify icons with map by @petraduriancikova in https://github.com/maptiler/maptiler-geocoding-control/pull/43
- Fix broken polygons by @zdila in https://github.com/maptiler/maptiler-geocoding-control/pull/44
- added zooming by feature type by @zdila in https://github.com/maptiler/maptiler-geocoding-control/pull/45
- updated dependencies by @zdila in https://github.com/maptiler/maptiler-geocoding-control/pull/47

**Full Changelog**: https://github.com/maptiler/maptiler-geocoding-control/compare/v1.3.3...v1.4.0

## 1.3.3

### What's Changed

- updated dependencies; code cleanup by @zdila in https://github.com/maptiler/maptiler-geocoding-control/pull/41

**Full Changelog**: https://github.com/maptiler/maptiler-geocoding-control/compare/v1.3.2...v1.3.3

## 1.3.2

### What's Changed

- fixed source map filename mismatch by @zdila in https://github.com/maptiler/maptiler-geocoding-control/pull/39
- fixed OL UMD globals by @zdila in https://github.com/maptiler/maptiler-geocoding-control/pull/40
- Svelte optional peer dependency by @zdila in https://github.com/maptiler/maptiler-geocoding-control/pull/38

**Full Changelog**: https://github.com/maptiler/maptiler-geocoding-control/compare/v1.3.1...v1.3.2

## 1.3.1

### What's Changed

- OpeLayers with useGeographic by @zdila in https://github.com/maptiler/maptiler-geocoding-control/pull/36
- fixed replace-env-vars by @zdila in https://github.com/maptiler/maptiler-geocoding-control/pull/37

**Full Changelog**: https://github.com/maptiler/maptiler-geocoding-control/compare/v1.3.0...v1.3.1

## 1.3.0

### What's Changed

- pre-commit linting and formatting validation by @zdila in https://github.com/maptiler/maptiler-geocoding-control/pull/31
- updated dependencies by @zdila in https://github.com/maptiler/maptiler-geocoding-control/pull/32
- Reactive enableReverse by @zdila in https://github.com/maptiler/maptiler-geocoding-control/pull/33
- externalize global variable of OL for UMD; updated examples by @zdila in https://github.com/maptiler/maptiler-geocoding-control/pull/34

**Full Changelog**: https://github.com/maptiler/maptiler-geocoding-control/compare/v1.2.4...v1.3.0

## 1.2.4

### What's Changed

- fixed clearing map features on map style switching by @zdila in https://github.com/maptiler/maptiler-geocoding-control/pull/30

**Full Changelog**: https://github.com/maptiler/maptiler-geocoding-control/compare/v1.2.3...v1.2.4

## 1.2.3

### What's Changed

- fixed reverse geocoding not working on map click if showResultsWhileTyping=false by @zdila in https://github.com/maptiler/maptiler-geocoding-control/pull/27
- added support for Leaflet 1.7 by @zdila in https://github.com/maptiler/maptiler-geocoding-control/pull/29
- updated dependencies by @zdila in https://github.com/maptiler/maptiler-geocoding-control/pull/28

**Full Changelog**: https://github.com/maptiler/maptiler-geocoding-control/compare/v1.2.2...v1.2.3

## 1.2.2

### What's Changed

- Added support for MapLibre GL JS 4.0 and updated also other dependencies (fixes #23) by @zdila in https://github.com/maptiler/maptiler-geocoding-control/pull/24

**Full Changelog**: https://github.com/maptiler/maptiler-geocoding-control/compare/v1.2.1...v1.2.2

## 1.2.1

### What's Changed

- fix: Expose /types declaration file by @Kapcash in https://github.com/maptiler/maptiler-geocoding-control/pull/18
- updated dependencies by @zdila in https://github.com/maptiler/maptiler-geocoding-control/pull/20
- Search icon update by @zdila in https://github.com/maptiler/maptiler-geocoding-control/pull/21

### New Contributors

- @Kapcash made their first contribution in https://github.com/maptiler/maptiler-geocoding-control/pull/18

**Full Changelog**: https://github.com/maptiler/maptiler-geocoding-control/compare/v1.2.0...v1.2.1

## 1.2.0

### What's Changed

- Improved reverse geocoding coordinates parser by @zdila in https://github.com/maptiler/maptiler-geocoding-control/pull/17
- Added new control options: `selectFirst`, `flyToSelected` and `markerOnSelected` (a155080f4d772ba6116aa44e76624f60dc78d197)
- Improved UX of reverse geocoding

**Full Changelog**: https://github.com/maptiler/maptiler-geocoding-control/compare/v1.1.1...v1.2.0

## 1.1.1

fixed svelte export

## 1.1.0

- added `excludeTypes` parameter
- updated dependencies

## 1.0.1

- fixed problem with missing markers (missing styles)
- updated versions of the dependencies

## 1.0.0

This is the first stable version of the Maptiler Geocoding Control.
