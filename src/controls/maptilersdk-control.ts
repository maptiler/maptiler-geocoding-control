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

  /** Options the control overrides, as originally provided by the user */
  readonly #userOptions: Pick<MaptilerGeocodingControlOptions, "adjustUrl"> = {};

  readonly #adjustUrlWithSession = (url: URL) => {
    this.#userOptions.adjustUrl?.(url);

    const { session, apiUrl } = this.getOptions();
    if ((config.session ? session !== false : session === true) && this.#map && (!apiUrl || new URL(apiUrl).host === new URL(import.meta.env.VITE_API_URL).host)) {
      url.searchParams.append("mtsid", this.#map.getMaptilerSessionId());
    }
  };

  constructor(options: MaptilerGeocodingControlOptions = {}) {
    super();
    this.setOptions(options);
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

  override getOptions(): MaptilerGeocodingControlOptions {
    const options = super.getOptions();
    delete options.adjustUrl;
    return Object.assign(options, this.#userOptions);
  }

  override setOptions(options: MaptilerGeocodingControlOptions) {
    if ("adjustUrl" in options) {
      this.#userOptions.adjustUrl = options.adjustUrl;
    }
    super.setOptions({ ...options, adjustUrl: this.#adjustUrlWithSession });
  }

  declare on: EventHandlingMethod<Subscription>;
  declare off: EventHandlingMethod<this>;
  declare once: EventOnceHandlingMethod<this>;
}
