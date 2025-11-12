import { convert } from "geo-coordinates-parser";
import { LitElement, css, html, nothing, unsafeCSS } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { repeat } from "lit/directives/repeat.js";

import type { BBox, EnableReverse, Feature, FeatureCollection, ProximityRule, ShowPlaceType, TypeRule } from "../types";
import { wrapNum } from "../utils/geo-utils";
import { getProximity } from "../utils/proximity";

import "../components/clear-icon";
import "../components/fail-icon";
import "../components/loading-icon";
import "../components/reverse-geocoding-icon";
import "../components/search-icon";

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
  @property({ type: String }) class?: string;
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

  @query("input") private input!: HTMLInputElement;

  @state() private searchValue: string = "";
  @state() private listFeatures?: Feature[];
  @state() private selectedItemIndex: number = -1;
  @state() private picked?: Feature;
  @state() private cachedFeatures: Feature[] = [];
  @state() private lastSearchUrl: string = "";
  @state() private error: unknown;
  @state() private abortController?: AbortController; // beware, this one is referenced in template
  @state() private focused: boolean = false;
  @state() private focusedDelayed: boolean = false;

  #isInitialized = false;
  #searchTimeoutRef?: number;
  #missingIconsCache = new Set<string>();
  #centerAndZoom: [zoom: number, lon: number, lat: number] | undefined;

  get #selected(): Feature | undefined {
    return this.listFeatures?.[this.selectedItemIndex];
  }
  get #isFeatureListVisible(): boolean {
    return !!this.listFeatures?.length && (this.focusedDelayed || this.keepListOpen);
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
    this.#changeSearchValue(value);
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
      this.#search(this.searchValue, { exact: true })
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

  #changeSearchValue(searchValue: string) {
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
        this.#search(sv).catch((err: unknown) => (this.error = err));
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

  async #search(searchValue: string, { byId = false, exact = false }: undefined | { byId?: boolean; exact?: boolean } = {}) {
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

      // const [zoom] = mapController?.getCenterAndZoom() ?? [];
      const zoom = undefined as number | undefined;

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
        console.warn("For reverse geocoding when limit > 1 then types must contain single value.");
      }

      if (isReverse) {
        if (effReverseGeocodingLimit === 1 || this.exhaustiveReverseGeocoding || effTypes?.length === 1) {
          sp.set("limit", String(effReverseGeocodingLimit));
        }
        // } else if (this.limit !== undefined) {
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
            this.listFeatures = undefined;
            // this.#dispatch("featuresclear");
            // this.#clearFeatures();
          }

          this.picked = this.cachedFeatures[0];
        } else {
          this.listFeatures = this.cachedFeatures;
          // this.#dispatch("featureslisted", { features: this.listFeatures });

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
            place_name: `${isReverse.decimalLatitude}, ${isReverse.decimalLongitude}`,
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

        this.#dispatch("featureslisted", { features: this.listFeatures });

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
    if (this.picked && this.picked.id === feature.id) {
      // this.#goToPicked();
    } else {
      this.picked = feature;
      this.searchValue = feature.place_name;
    }
  }

  #handleMouseEnter(index: number) {
    this.selectedItemIndex = index;
  }

  #handleMouseLeave() {
    if (!this.selectFirst !== false || this.picked) {
      this.selectedItemIndex = -1;
    }

    // // re-focus on picked
    // if (this.flyToSelected) {
    //   this.#goToPicked();
    // }
  }

  #handleClear() {
    this.searchValue = "";
    this.#dispatch("queryclear");

    this.picked = undefined;
    this.input.focus();
  }

  willUpdate(changedProperties: Map<string, unknown>) {
    if (changedProperties.has("error") && this.error) {
      console.error("Error from geocoding component", this.error);
    }

    if (changedProperties.has("enableReverse")) {
      this.reverseActive = this.enableReverse === "always";
    }

    // @TODO is this needed or is it handled by a different piece of code??
    if (["picked"].some((prop) => changedProperties.has(prop))) {
      if (this.picked) {
        if (this.clearListOnPick) {
          this.#clearFeatures();
        }

        // this.markedFeatures = undefined;
        this.selectedItemIndex = -1;
      }
    }

    // if (["markedFeatures", "listFeatures"].some((prop) => changedProperties.has(prop)) && this.markedFeatures !== this.listFeatures) {
    //   this.markedFeatures = undefined;
    // }

    if (["searchValue", "minLength"].some((prop) => changedProperties.has(prop)) && this.#isSearchValueTooShort) {
      this.#clearFeatures();
      this.error = undefined;
    }

    if (["focused"].some((prop) => changedProperties.has(prop))) {
      setTimeout(() => {
        this.focusedDelayed = this.focused;
      });
    }

    // close dropdown in the next cycle so that the selected item event has the chance to fire
    if (["focused"].some((prop) => changedProperties.has(prop))) {
      setTimeout(() => {
        if (this.clearOnBlur && !this.focused) {
          this.searchValue = "";
        }
      });
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

    // if (["searchValue"].some((prop) => changedProperties.has(prop))) {
    //   this.#dispatch("querychange", { query: this.searchValue });
    // }

    // if (["listFeatures"].some((prop) => changedProperties.has(prop))) {
    //   this.#dispatch("featureslisted", { features: this.listFeatures });
    // }

    if (["listFeatures", "selectedItemIndex"].some((prop) => changedProperties.has(prop))) {
      this.#dispatch("select", { feature: this.#selected });
    }

    if (["picked"].some((prop) => changedProperties.has(prop))) {
      if (this.picked) {
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

    if (["listFeatures", "focusedDelayed"].some((prop) => changedProperties.has(prop))) {
      this.#dispatch(this.#isFeatureListVisible ? "featuresshow" : "featureshide");
    }

    // if (["markedFeatures"].some((prop) => changedProperties.has(prop))) {
    //   this.#dispatch("featuresmarked", { features: this.markedFeatures });
    // }

    if (["reverseActive"].some((prop) => changedProperties.has(prop))) {
      this.#dispatch("reversetoggle", { reverse: this.reverseActive });
    }

    // if (["reverseActive"].some((prop) => changedProperties.has(prop)) && mapController) {
    //   mapController.indicateReverse(this.reverseActive);
    // }
  }

  render() {
    /* eslint-disable @typescript-eslint/unbound-method */
    return html`
      <form @submit=${this.#handleSubmit} class=${classMap({ [this.class ?? ""]: true, "can-collapse": this.collapsed && this.searchValue === "" })}>
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
                <div>${this.error}</div>

                <button @click=${() => (this.error = undefined)}>
                  <maptiler-geocode-clear-icon></maptiler-geocode-clear-icon>
                </button>
              </div>
            `
          : (!this.focusedDelayed && !this.keepListOpen) || this.listFeatures === undefined
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
                  <ul class="options" @mouseleave=${this.#handleMouseLeave} @keydown=${this.#handleKeyDown} role="listbox">
                    ${repeat(
                      this.listFeatures,
                      (feature) => feature.id + (feature.address ? "," + feature.address : ""),
                      (feature, i) => html`
                        <feature-item
                          .feature=${feature}
                          .showPlaceType=${this.showPlaceType ?? "if-needed"}
                          style=${this.selectedItemIndex === i ? "selected" : this.picked?.id === feature.id ? "picked" : "default"}
                          @mouseenter=${() => {
                            this.#handleMouseEnter(i);
                          }}
                          @select=${() => {
                            this.#pick(feature);
                          }}
                          @click=${() => {
                            this.#pick(feature); // @TODO temporary only until select event used above is implemented
                          }}
                          .missingIconsCache=${this.#missingIconsCache}
                          .iconsBaseUrl=${this.iconsBaseUrl ?? `https://cdn.maptiler.com/maptiler-geocoding-control/v${import.meta.env.VITE_LIB_VERSION}/icons/`}
                        >
                          ${feature.place_name}
                        </feature-item>
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
  "class",
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
  "placeholder",
  "proximity",
  "reverseActive",
  "reverseButtonTitle",
  "selectFirst",
  "showPlaceType",
  "showResultsWhileTyping",
  "types",
  "reverseGeocodingTypes",
] as const satisfies readonly (keyof MaptilerGeocoderOptions)[];
