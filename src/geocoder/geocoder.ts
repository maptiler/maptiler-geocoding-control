import { convert } from "geo-coordinates-parser";
import { LitElement, css, html, nothing, unsafeCSS } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { repeat } from "lit/directives/repeat.js";

import type { BBox, EnableReverse, Feature, FeatureCollection, ProximityRule, ShowPlaceType, TypeRule, Worldview } from "../types";
import { wrapNum } from "../utils/geo-utils";
import { getProximity } from "../utils/proximity";

import "../components/clear-icon";
import "../components/fail-icon";
import "../components/loading-icon";
import "../components/reverse-geocoding-icon";
import "../components/search-icon";
import "./geocoder-feature-item";

import type { MaptilerGeocoderEventName, MaptilerGeocoderEventNameMap } from "./geocoder-events";
import type { MaptilerGeocoderOptions } from "./geocoder-options";
import styles from "./geocoder.css?inline";

@customElement("maptiler-geocoder")
export class MaptilerGeocoderElement extends LitElement implements MaptilerGeocoderOptions {
  static styles = css`
    ${unsafeCSS(styles)}
  `;

  @property({ attribute: false }) adjustUrl?: (url: URL) => void;
  @property({ type: String }) apiKey?: string;
  @property({ type: String }) apiUrl?: string;
  @property({ type: Array }) bbox?: BBox;
  @property({ type: String }) clearButtonTitle?: string;
  @property({ type: Boolean }) clearListOnPick: boolean = false;
  @property({ type: Boolean }) clearOnBlur: boolean = false;
  @property({ type: Boolean }) collapsed: boolean = false;
  @property({ attribute: false }) country?: string | string[];
  @property({ type: Number }) debounceSearch?: number;
  @property({ type: String }) enableReverse?: EnableReverse;
  @property({ type: String }) errorMessage?: string;
  @property({ type: Boolean }) excludeTypes: boolean = false;
  @property({ type: Boolean }) exhaustiveReverseGeocoding: boolean = false;
  @property({ type: Boolean }) fetchFullGeometryOnPick: boolean = false;
  @property({ type: Object }) fetchParameters?: RequestInit;
  @property({ attribute: false }) filter?: (feature: Feature) => boolean;
  @property({ type: Object }) fuzzyMatch?: boolean | undefined; // type object because undefined is valid value
  @property({ type: String }) iconsBaseUrl?: string;
  @property({ type: Boolean }) keepListOpen: boolean = false;
  @property({ attribute: false }) language?: string | string[] | null;
  @property({ type: Number }) limit?: number;
  @property({ type: Number }) minLength?: number;
  @property({ type: String }) noResultsMessage?: string;
  @property({ type: Boolean }) openListOnTop: boolean = false;
  @property({ type: String }) placeholder?: string;
  @property({ type: Array }) proximity?: ProximityRule[] | null;
  @property({ type: Boolean }) reverseActive: boolean = false;
  @property({ type: String }) reverseButtonTitle?: string;
  @property({ type: Object }) reverseGeocodingExcludeTypes?: boolean | undefined; // type object because undefined is valid value
  @property({ type: Number }) reverseGeocodingLimit?: number;
  @property({ type: Array }) reverseGeocodingTypes?: TypeRule[];
  @property({ type: Object }) selectFirst?: boolean | undefined; // type object because undefined is valid value
  @property({ type: String }) showPlaceType?: ShowPlaceType;
  @property({ type: Object }) showResultsWhileTyping?: boolean | undefined; // type object because undefined is valid value
  @property({ type: Array }) types?: TypeRule[];
  @property({ type: String }) worldview?: Worldview;

  /** Reference to the input element the user can type a query into */
  @query("input") private input!: HTMLInputElement;

  /** Value to search via geocoding */
  @state() private searchValue: string = "";
  /** Features found via geocoding */
  @state() private listFeatures?: Feature[];
  /** Index of item currently selected from the list of found features */
  @state() private selectedItemIndex: number = -1;
  /** Feature that has been picked by the user */
  @state() private picked?: Feature;
  /** Cached found features to be used to restore the features when loading more data for picked feature */
  @state() private cachedFeatures: Feature[] = [];
  /** Effectively a cache key for cached features */
  @state() private lastSearchUrl: string = "";
  /** Last error that happened in geocoding, to be shown to user */
  @state() private error: unknown;
  /** AbortController instance used to potentially cancel the current geocoding request*/
  @state() private abortController?: AbortController;
  /** Focus state of input element */
  @state() private focused: boolean = false;
  /** Visibility state of feature list */
  @state() private isFeatureListVisible = false;
  /** Feature list is currently interacted with using pointer device so it should not be closed even though input lost focus */
  @state() private isFeatureListInteractedWith = false;

  /** Helps to trigger logic only after this instance gets fully initialized */
  #isInitialized = false;
  /** Timeout ref for debouncing logic */
  #searchTimeoutRef?: number;
  /** Cache for URLs of icons that couldn't be loaded for any reason, as to not try them again unnecessarily */
  #missingIconsCache = new Set<string>();
  /** Center and zoom of a map potentially connected to this instance */
  #centerAndZoom: [zoom: number, lon: number, lat: number] | undefined;

  get #selected(): Feature | undefined {
    return this.listFeatures?.[this.selectedItemIndex];
  }
  get #isLoading(): boolean {
    return this.abortController !== undefined;
  }
  get #isSearchValueTooShort(): boolean {
    return this.searchValue.length < (this.minLength ?? 2);
  }

  protected firstUpdated() {
    this.#isInitialized = true;
  }

  /**
   * Set the options of this instance.
   *
   * @param options options to set
   */
  setOptions(options: Partial<MaptilerGeocoderOptions>) {
    const elementOptions = { ...options };
    for (const prop of Object.keys(elementOptions) as Array<keyof MaptilerGeocoderOptions>) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      if (!propertyNames.includes(prop)) delete elementOptions[prop];
    }
    Object.assign(this, elementOptions);
  }

  /**
   * Set the content of search input box.
   *
   * @param value text to set
   */
  setQuery(value: string) {
    this.#changeSearchValue(value, { external: true });
    this.#focusInputAndSelectText();
  }

  /**
   * Set the content of search input box and immediately submit it.
   *
   * @param value text to set and submit
   */
  submitQuery(value: string) {
    this.#submitSearchValue(value);
  }

  /**
   * Clear search result list.
   */
  clearList() {
    this.#clearFeatures();
    this.picked = undefined;
    this.selectedItemIndex = -1;
  }

  /**
   * Focus the search input box.
   *
   * @param options [FocusOptions](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus#options)
   */
  override focus(options?: FocusOptions) {
    this.input.focus(options);
  }

  /**
   * Blur the search input box.
   */
  override blur() {
    this.input.blur();
  }

  override addEventListener<E extends MaptilerGeocoderEventName>(
    type: E,
    listener: (this: HTMLElement, e: MaptilerGeocoderEventNameMap[E]) => unknown,
    options?: boolean | AddEventListenerOptions,
  ): void;
  override addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void {
    super.addEventListener(type, listener, options);
  }

  override removeEventListener<E extends MaptilerGeocoderEventName>(
    type: E,
    listener: (this: HTMLElement, e: MaptilerGeocoderEventNameMap[E]) => unknown,
    options?: boolean | EventListenerOptions,
  ): void;
  override removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void {
    super.removeEventListener(type, listener, options);
  }

  /** @internal */
  handleMapChange(centerAndZoom: [zoom: number, lon: number, lat: number] | undefined): void {
    this.#centerAndZoom = centerAndZoom;
  }

  /** @internal */
  handleMapClick(coordinates: [lng: number, lat: number]) {
    if (this.reverseActive) {
      this.#handleReverse(coordinates);
    }
  }

  #dispatch<T extends keyof MaptilerGeocoderEventNameMap>(
    type: T,
    ...[detail]: undefined extends MaptilerGeocoderEventNameMap[T]["detail"] ? [] : [detail: MaptilerGeocoderEventNameMap[T]["detail"]]
  ): void {
    if (!this.#isInitialized) return;

    this.dispatchEvent(
      new CustomEvent(type, {
        bubbles: true,
        composed: true,
        detail,
      }),
    );
  }

  #handleSubmit(event?: Event) {
    event?.preventDefault();

    this.focused = false;

    clearTimeout(this.#searchTimeoutRef);

    if (this.selectedItemIndex > -1 && this.listFeatures) {
      this.picked = this.listFeatures[this.selectedItemIndex];

      this.searchValue = this.picked.place_type[0] === "reverse" ? this.picked.place_name : this.picked.place_name.replace(/,.*/, "");

      this.error = undefined;

      this.selectedItemIndex = -1;
    } else if (this.searchValue) {
      this.#search(this.searchValue, { exact: true, external: event === undefined })
        .then(() => {
          this.picked = undefined;
        })
        .catch((err: unknown) => (this.error = err));
    }
  }

  #isQueryReverse(searchValue: string) {
    try {
      return convert(searchValue, 6);
    } catch {
      return false;
    }
  }

  #focusInputAndSelectText() {
    setTimeout(() => {
      this.input.focus();
      this.focused = true;
      this.input.select();
    });
  }

  #changeSearchValue(searchValue: string, { external = false }: { external?: boolean } = {}) {
    this.searchValue = searchValue;
    this.#dispatch("querychange", { query: this.searchValue, reverseCoords: this.#isQueryReverse(searchValue) });

    this.error = undefined;
    this.picked = undefined;

    if (this.showResultsWhileTyping !== false) {
      clearTimeout(this.#searchTimeoutRef);

      if (this.#isSearchValueTooShort) {
        return;
      }

      const sv = this.searchValue;

      this.#searchTimeoutRef = window.setTimeout(() => {
        this.#search(sv, { external }).catch((err: unknown) => (this.error = err));
      }, this.debounceSearch ?? 200);
    } else {
      this.#clearFeatures();
    }
  }

  #clearFeatures() {
    if (this.listFeatures !== undefined) {
      this.listFeatures = undefined;
      this.#dispatch("featuresclear");
    }
  }

  #submitSearchValue(searchValue: string) {
    this.searchValue = searchValue;
    this.#dispatch("querychange", { query: this.searchValue, reverseCoords: this.#isQueryReverse(searchValue) });

    this.selectedItemIndex = -1;
    this.#handleSubmit();
  }

  async #search(searchValue: string, { byId = false, exact = false, external = false }: undefined | { byId?: boolean; exact?: boolean; external?: boolean } = {}) {
    this.error = undefined;

    this.abortController?.abort();
    const ac = new AbortController();
    this.abortController = ac;

    try {
      const apiUrl = this.apiUrl ?? import.meta.env.VITE_API_URL;
      const isReverse = this.#isQueryReverse(searchValue);

      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      const urlObj = new URL(apiUrl + "/" + encodeURIComponent(isReverse ? `${isReverse.decimalLongitude},${isReverse.decimalLatitude}` : searchValue) + ".json");

      const sp = urlObj.searchParams;

      if (this.language !== undefined) {
        sp.set("language", Array.isArray(this.language) ? this.language.join(",") : (this.language ?? ""));
      }

      const [zoom] = this.#centerAndZoom ?? [undefined];

      let effTypes = (!isReverse || this.reverseGeocodingTypes === undefined ? this.types : this.reverseGeocodingTypes)
        ?.map((typeRule) =>
          typeof typeRule === "string" ? typeRule : zoom === undefined || ((typeRule[0] ?? 0) <= zoom && zoom < (typeRule[1] ?? Infinity)) ? typeRule[2] : undefined,
        )
        .filter((type) => type !== undefined);

      if (effTypes) {
        effTypes = [...new Set(effTypes)];

        sp.set("types", effTypes.join(","));
      }

      const effExcludeTypes = !isReverse || this.reverseGeocodingExcludeTypes === undefined ? this.excludeTypes : this.reverseGeocodingExcludeTypes;

      if (effExcludeTypes) {
        sp.set("excludeTypes", String(effExcludeTypes));
      }

      if (this.bbox) {
        sp.set("bbox", this.bbox.map((c) => c.toFixed(6)).join(","));
      }

      if (this.country) {
        sp.set("country", Array.isArray(this.country) ? this.country.join(",") : this.country);
      }

      if (this.worldview) {
        sp.set("worldview", this.worldview);
      }

      if (!byId && !isReverse) {
        const proximity = this.proximity ?? [{ type: "server-geolocation" }];
        const coords = await getProximity(this.#centerAndZoom, proximity, ac);

        if (coords) {
          sp.set("proximity", coords);
        }

        if (exact || this.showResultsWhileTyping === false) {
          sp.set("autocomplete", "false");
        }

        sp.set("fuzzyMatch", String(this.fuzzyMatch !== false));
      }

      const limit = this.limit ?? 5;
      const effReverseGeocodingLimit = this.reverseGeocodingLimit ?? limit;

      if (effReverseGeocodingLimit > 1 && effTypes?.length !== 1) {
        console.warn("[MapTilerGeocodingControl] Warning: For reverse geocoding when limit > 1 then types must contain single value.");
      }

      if (isReverse) {
        if (effReverseGeocodingLimit === 1 || this.exhaustiveReverseGeocoding || effTypes?.length === 1) {
          sp.set("limit", String(effReverseGeocodingLimit));
        }
      } else {
        sp.set("limit", String(limit));
      }

      if (this.apiKey) {
        sp.set("key", this.apiKey);
      }

      this.adjustUrl?.(urlObj);

      const noTypes = urlObj.searchParams.get("types") === "" && urlObj.searchParams.get("excludeTypes") !== "true";

      const url = urlObj.toString();

      if (url === this.lastSearchUrl) {
        if (byId) {
          if (this.clearListOnPick) {
            this.#clearFeatures();
          }

          this.picked = this.cachedFeatures[0];
        } else {
          this.listFeatures = this.cachedFeatures;
          this.#dispatch("featureslisted", { features: this.listFeatures, external });

          if (this.listFeatures[this.selectedItemIndex]?.id !== this.#selected?.id) {
            this.selectedItemIndex = -1;
          }
        }

        return;
      }

      this.#dispatch("request", { urlObj });

      this.lastSearchUrl = url;

      let featureCollection: FeatureCollection;

      if (noTypes) {
        featureCollection = { type: "FeatureCollection", features: [] };
      } else {
        const res = await fetch(url, {
          signal: ac.signal,
          ...this.fetchParameters,
        });

        if (!res.ok) {
          throw new Error(await res.text());
        }

        featureCollection = (await res.json()) as FeatureCollection;
      }

      this.#dispatch("response", { url, featureCollection });

      if (byId) {
        if (this.clearListOnPick) {
          this.#clearFeatures();
        }

        this.picked = featureCollection.features[0];

        this.cachedFeatures = [this.picked];
      } else {
        this.listFeatures = featureCollection.features.filter(this.filter ?? (() => true));

        if (isReverse) {
          this.listFeatures.unshift({
            type: "Feature",
            properties: {},
            /* eslint-disable @typescript-eslint/restrict-template-expressions */
            id: `reverse_${isReverse.decimalLongitude}_${isReverse.decimalLatitude}`,
            text: `${isReverse.decimalLatitude}, ${isReverse.decimalLongitude}`,
            place_name: isReverse.toCoordinateFormat("DMS"),
            /* eslint-enable @typescript-eslint/restrict-template-expressions */
            place_type: ["reverse"],
            place_type_name: ["reverse"],
            center: [isReverse.decimalLongitude, isReverse.decimalLatitude],
            bbox: [isReverse.decimalLongitude, isReverse.decimalLatitude, isReverse.decimalLongitude, isReverse.decimalLatitude],
            geometry: {
              type: "Point",
              coordinates: [isReverse.decimalLongitude, isReverse.decimalLatitude],
            },
          });
        }

        this.#dispatch("featureslisted", { features: this.listFeatures, external });

        this.cachedFeatures = this.listFeatures;

        if (this.listFeatures[this.selectedItemIndex]?.id !== this.#selected?.id) {
          this.selectedItemIndex = -1;
        }

        if (isReverse) {
          this.input.focus();
        }
      }
    } catch (e: unknown) {
      if (e && typeof e === "object" && "name" in e && e.name === "AbortError") {
        return;
      }

      throw e;
    } finally {
      if (ac === this.abortController) {
        this.abortController = undefined;
      }
    }
  }

  #handleReverse(coordinates: [lng: number, lat: number]) {
    this.reverseActive = this.enableReverse === "always";

    this.#clearFeatures();
    this.picked = undefined;

    this.#submitSearchValue(`${coordinates[1].toFixed(6)}, ${wrapNum(coordinates[0], [-180, 180], true).toFixed(6)}`);
    this.#focusInputAndSelectText();
  }

  #handleKeyDown(e: KeyboardEvent) {
    if (!this.listFeatures) {
      return;
    }

    const dir = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;

    if (!dir) {
      return;
    }

    this.input.focus();

    this.focused = true;

    e.preventDefault();

    if (this.picked && this.selectedItemIndex === -1) {
      this.selectedItemIndex = this.listFeatures.findIndex((listFeature) => listFeature.id === this.picked?.id);
    }

    if (this.selectedItemIndex === (this.picked || this.selectFirst !== false ? 0 : -1) && dir === -1) {
      this.selectedItemIndex = this.listFeatures.length;
    }

    this.selectedItemIndex += dir;

    if (this.selectedItemIndex >= this.listFeatures.length) {
      this.selectedItemIndex = -1;
    }

    if (this.selectedItemIndex < 0 && (this.picked || this.selectFirst !== false)) {
      this.selectedItemIndex = 0;
    }
  }

  #handleInput(event: InputEvent & { target: HTMLInputElement }) {
    this.#changeSearchValue(event.target.value);
  }

  #pick(feature: Feature) {
    if (!this.picked || this.picked.id !== feature.id) {
      this.picked = feature;
      this.searchValue = feature.place_name;
    }
  }

  #handlePointerEnter(index: number) {
    this.selectedItemIndex = index;
  }

  #handlePointerLeave() {
    if (!this.selectFirst !== false || this.picked) {
      this.selectedItemIndex = -1;
    }
    if (this.isFeatureListInteractedWith) {
      this.isFeatureListInteractedWith = false;
    }
  }

  #handlePointerDown() {
    this.isFeatureListInteractedWith = true;
  }

  #handlePointerUp() {
    setTimeout(() => {
      this.isFeatureListInteractedWith = false;
    });
  }

  #handleClear() {
    this.searchValue = "";
    this.#dispatch("queryclear");

    this.picked = undefined;
    this.input.focus();
  }

  willUpdate(changedProperties: Map<string, unknown>) {
    if (changedProperties.has("error") && this.error) {
      console.error("[MapTilerGeocodingControl] Error:", this.error);
    }

    if (changedProperties.has("enableReverse")) {
      this.reverseActive = this.enableReverse === "always";
    }

    if (["picked"].some((prop) => changedProperties.has(prop))) {
      if (this.picked) {
        if (this.clearListOnPick) {
          this.#clearFeatures();
        }

        this.selectedItemIndex = -1;
      }
    }

    if (["searchValue", "minLength"].some((prop) => changedProperties.has(prop)) && this.#isSearchValueTooShort) {
      this.#clearFeatures();
      this.error = undefined;
    }

    if (["focused", "listIsInteractedWith"].some((prop) => changedProperties.has(prop))) {
      if (this.clearOnBlur && !this.focused && !this.isFeatureListInteractedWith) {
        this.searchValue = "";
      }
    }

    if (
      ["selectFirst", "listFeatures", "selectedItemIndex", "picked"].some((prop) => changedProperties.has(prop)) &&
      this.selectFirst !== false &&
      this.listFeatures?.length &&
      this.selectedItemIndex == -1 &&
      !this.picked
    ) {
      this.selectedItemIndex = 0;
    }

    if (["listFeatures", "selectedItemIndex"].some((prop) => changedProperties.has(prop))) {
      this.#dispatch("select", { feature: this.#selected });
    }

    if (["picked"].some((prop) => changedProperties.has(prop))) {
      if (this.picked && this.picked.id !== (changedProperties.get("picked") as Feature | undefined)?.id) {
        (this.fetchFullGeometryOnPick && !this.picked.address && this.picked.geometry.type === "Point" && this.picked.place_type[0] !== "reverse"
          ? this.#search(this.picked.id, { byId: true })
          : Promise.resolve()
        ).then(
          () => {
            this.#dispatch("pick", { feature: this.picked });
          },
          (e: unknown) => {
            if (e && typeof e === "object" && "name" in e && e.name === "AbortError") return;
            this.error = e;
            this.#dispatch("pick", { feature: this.picked });
          },
        );
      }
    }

    if (["listFeatures", "focused", "isFeatureListInteractedWith", "keepListOpen"].some((prop) => changedProperties.has(prop))) {
      this.isFeatureListVisible = !!this.listFeatures?.length && (this.focused || this.isFeatureListInteractedWith || this.keepListOpen);
    }

    if (["isFeatureListVisible"].some((prop) => changedProperties.has(prop))) {
      if (this.isFeatureListVisible) {
        this.#dispatch("featuresshow");
      } else {
        this.#dispatch("featureshide");
      }
    }

    if (["reverseActive"].some((prop) => changedProperties.has(prop))) {
      this.#dispatch("reversetoggle", { reverse: this.reverseActive });
    }
  }

  render() {
    /* eslint-disable @typescript-eslint/unbound-method */
    return html`
      <form @submit=${this.#handleSubmit} class=${classMap({ "can-collapse": this.collapsed && this.searchValue === "" })}>
        <div class="input-group">
          <button
            class="search-button"
            type="button"
            @click=${() => {
              this.input.focus();
            }}
          >
            <maptiler-geocode-search-icon></maptiler-geocode-search-icon>
          </button>

          <input
            .value=${this.searchValue}
            @focus=${() => (this.focused = true)}
            @blur=${() => (this.focused = false)}
            @click=${() => (this.focused = true)}
            @keydown=${this.#handleKeyDown}
            @input=${this.#handleInput}
            @change=${() => (this.picked = undefined)}
            placeholder=${this.placeholder ?? "Search"}
            aria-label=${this.placeholder ?? "Search"}
          />

          <div class="clear-button-container ${classMap({ displayable: this.searchValue !== "" })}">
            ${!this.#isLoading
              ? html`
                  <button type="button" @click=${this.#handleClear} title=${this.clearButtonTitle ?? "clear"}>
                    <maptiler-geocode-clear-icon></maptiler-geocode-clear-icon>
                  </button>
                `
              : html`<maptiler-geocode-loading-icon></maptiler-geocode-loading-icon>`}
          </div>

          ${this.enableReverse === "button"
            ? html`
                <button
                  type="button"
                  class=${classMap({ active: this.reverseActive })}
                  title=${this.reverseButtonTitle ?? "toggle reverse geocoding"}
                  @click=${() => (this.reverseActive = !this.reverseActive)}
                >
                  <maptiler-geocode-reverse-geocoding-icon></maptiler-geocode-reverse-geocoding-icon>
                </button>
              `
            : nothing}

          <!-- <slot /> -->
        </div>

        ${this.error
          ? html`
              <div class="error">
                <maptiler-geocode-fail-icon></maptiler-geocode-fail-icon>

                <div>${this.errorMessage ?? "Something went wrong…"}</div>

                <button @click=${() => (this.error = undefined)}>
                  <maptiler-geocode-clear-icon></maptiler-geocode-clear-icon>
                </button>
              </div>
            `
          : (!this.focused && !this.isFeatureListInteractedWith && !this.keepListOpen) || this.listFeatures === undefined
            ? nothing
            : this.listFeatures.length === 0
              ? html`
                  <div class="no-results">
                    <maptiler-geocode-fail-icon></maptiler-geocode-fail-icon>

                    <div>
                      ${this.noResultsMessage ??
                      "Oops! Looks like you're trying to predict something that's not quite right. We can't seem to find what you're looking for. Maybe try double-checking your spelling or try a different search term. Keep on typing - we'll do our best to get you where you need to go!"}
                    </div>
                  </div>
                `
              : html`
                  <ul
                    class="options ${classMap({ "open-on-top": this.openListOnTop })}"
                    @pointerleave=${this.#handlePointerLeave}
                    @pointerdown=${this.#handlePointerDown}
                    @pointerup=${this.#handlePointerUp}
                    @keydown=${this.#handleKeyDown}
                    role="listbox"
                  >
                    ${repeat(
                      this.listFeatures,
                      (feature) => feature.id + (feature.address ? "," + feature.address : ""),
                      (feature, i) => html`
                        <maptiler-geocoder-feature-item
                          .feature=${feature}
                          .showPlaceType=${this.showPlaceType ?? "if-needed"}
                          itemStyle=${this.selectedItemIndex === i ? "selected" : this.picked?.id === feature.id ? "picked" : "default"}
                          @pointerenter=${() => {
                            this.#handlePointerEnter(i);
                          }}
                          @select=${() => {
                            this.#pick(feature);
                          }}
                          .missingIconsCache=${this.#missingIconsCache}
                          .iconsBaseUrl=${this.iconsBaseUrl ?? `https://cdn.maptiler.com/maptiler-geocoding-control/v${import.meta.env.VITE_LIB_VERSION}/icons/`}
                        />
                      `,
                    )}
                  </ul>
                `}
      </form>
    `;
    /* eslint-enable @typescript-eslint/unbound-method */
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "maptiler-geocoder": MaptilerGeocoderElement;
  }
}

const propertyNames = [
  "adjustUrl",
  "apiKey",
  "apiUrl",
  "bbox",
  "clearButtonTitle",
  "clearListOnPick",
  "clearOnBlur",
  "collapsed",
  "country",
  "debounceSearch",
  "enableReverse",
  "errorMessage",
  "excludeTypes",
  "reverseGeocodingExcludeTypes",
  "exhaustiveReverseGeocoding",
  "fetchParameters",
  "fetchFullGeometryOnPick",
  "filter",
  "fuzzyMatch",
  "iconsBaseUrl",
  "keepListOpen",
  "language",
  "limit",
  "reverseGeocodingLimit",
  "minLength",
  "noResultsMessage",
  "openListOnTop",
  "placeholder",
  "proximity",
  "reverseActive",
  "reverseButtonTitle",
  "selectFirst",
  "showPlaceType",
  "showResultsWhileTyping",
  "types",
  "reverseGeocodingTypes",
  "worldview",
] as const satisfies readonly (keyof MaptilerGeocoderOptions)[];
