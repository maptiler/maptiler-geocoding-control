import { config, Evented, type MapTilerMarkerElementOptions, type MapTilerMarkerSVGOptions, Marker, Popup, type PopupOptions, type Map as SDKMap } from "@maptiler/sdk";
import { name, version } from "../../package.json";
import { mixinEvented } from "../utils/mixin-evented.js";
import type { GeocodingControlBase } from "./base-control.js";
import { MaplibreglGeocodingControlBase } from "./maplibregl-control-base.js";
import type { MaptilerGeocodingControlEventNameMap } from "./maptilersdk-events.js";
import type { MaptilerGeocodingControlOptions } from "./maptilersdk-options.js";

export class MaptilerGeocodingControl
  extends MaplibreglGeocodingControlBase<
    MaptilerGeocodingControlOptions,
    MaptilerGeocodingControlEventNameMap,
    SDKMap,
    Marker,
    MapTilerMarkerElementOptions | MapTilerMarkerSVGOptions
  >
  implements GeocodingControlBase<MaptilerGeocodingControlOptions>
{
  #map?: SDKMap;

  constructor(options: MaptilerGeocodingControlOptions = {}) {
    super(options);
  }

  protected createMarker(options: MapTilerMarkerElementOptions | MapTilerMarkerSVGOptions): Marker {
    return options.element ? new Marker(options) : new Marker(options);
  }

  protected addMarker(map: SDKMap, marker: Marker): void {
    map.addMarker(marker);
  }

  protected setMarkerPopup(marker: Marker, options: PopupOptions, text: string): void {
    marker.setPopup(new Popup(options).setText(text));
  }

  /** @internal Not to be called directly */
  override onAdd(map: SDKMap): HTMLElement {
    this.#map = map;

    map.telemetry.registerModule(name, version);

    const options = this.getOptions();
    const { primaryLanguage, apiKey } = map.getSdkConfig();

    if (options.apiKey === undefined) {
      this.setOptions({ apiKey });
    }

    if (options.language === undefined) {
      const match = primaryLanguage.code?.match(/^([a-z]{2,3})($|_|-)/);
      if (match) {
        this.setOptions({ language: match[1] });
      }
    }

    const div = super.onAdd(map);
    div.classList.add("maptiler-ctrl-geocoder");
    div.querySelector("maptiler-geocoder")?.classList.add("maptiler-geocoder");
    return div;
  }

  /** @internal Not to be called directly */
  override onRemove(): void {
    super.onRemove();
    this.#map = undefined;
  }

  /** Adds the MapTiler session ID to geocoding requests, unless disabled by the `session` option (see also `session` of the SDK config) */
  protected override adjustRequestUrl(url: URL): void {
    const { session, apiUrl } = this.getOptions();

    if ((config.session ? session !== false : session === true) && this.#map && (!apiUrl || new URL(apiUrl).host === new URL(import.meta.env.VITE_API_URL).host)) {
      url.searchParams.append("mtsid", this.#map.getMaptilerSessionId());
    }
  }
}

mixinEvented(MaptilerGeocodingControl, Evented);
