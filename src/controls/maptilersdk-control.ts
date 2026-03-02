import { config, type Map as SDKMap, type Subscription } from "@maptiler/sdk";
import { name, version } from "../../package.json";
import type { GeocodingControlBase } from "./base-control";
import { MaplibreglGeocodingControl } from "./maplibregl-control";
import type { MaptilerGeocodingControlEventName, MaptilerGeocodingControlEventNameMap } from "./maptilersdk-events";
import type { MaptilerGeocodingControlOptions } from "./maptilersdk-options";

type EventHandlingMethod<Return> = <Type extends MaptilerGeocodingControlEventName>(type: Type, listener: (event: MaptilerGeocodingControlEventNameMap[Type]) => void) => Return;
interface EventOnceHandlingMethod<Return> {
  <Type extends MaptilerGeocodingControlEventName>(type: Type, listener: (event: MaptilerGeocodingControlEventNameMap[Type]) => void): Return;
  <Type extends MaptilerGeocodingControlEventName>(type: Type, listener?: undefined): Promise<MaptilerGeocodingControlEventNameMap[Type]>;
}

export class MaptilerGeocodingControl extends MaplibreglGeocodingControl implements GeocodingControlBase<MaptilerGeocodingControlOptions> {
  #map?: SDKMap;

  constructor(options: MaptilerGeocodingControlOptions = {}) {
    super(options);
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

  declare getOptions: () => MaptilerGeocodingControlOptions;

  override setOptions(options: MaptilerGeocodingControlOptions) {
    const originalAdjustUrl = options.adjustUrl;
    super.setOptions({
      ...options,
      adjustUrl: (url: URL) => {
        originalAdjustUrl?.(url);
        const opts = this.getOptions();
        if (
          (config.session ? options.session !== false : options.session === true) &&
          this.#map &&
          (!opts.apiUrl || new URL(opts.apiUrl).host === new URL(import.meta.env.VITE_API_URL).host)
        ) {
          url.searchParams.append("mtsid", this.#map.getMaptilerSessionId());
        }
      },
    });
  }

  declare on: EventHandlingMethod<Subscription>;
  declare off: EventHandlingMethod<this>;
  declare once: EventOnceHandlingMethod<this>;
}
