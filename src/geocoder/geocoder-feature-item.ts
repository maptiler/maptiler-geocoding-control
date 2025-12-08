/* eslint-disable
@typescript-eslint/no-unnecessary-condition,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-call,
  @typescript-eslint/no-unsafe-member-access,
  @typescript-eslint/no-unsafe-return,
  @typescript-eslint/restrict-template-expressions,
  @typescript-eslint/unbound-method,
*/
import { LitElement, css, html, nothing, unsafeCSS } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";

import type { Feature, ShowPlaceType } from "../types";
import styles from "./geocoder-feature-item.css?inline";

type SpriteIcon = { width: number; height: number; x: number; y: number };

const hidpi = typeof devicePixelRatio === "undefined" || devicePixelRatio > 1.25;

const scaleUrl = hidpi ? "@2x" : "";

const scaleFactor = hidpi ? 2 : 1;

let sprites: undefined | null | { width: number; height: number; icons: Record<string, SpriteIcon> };

let spritePromise: Promise<void> | undefined;

@customElement("maptiler-geocoder-feature-item")
export class MaptilerGeocoderFeatureItemElement extends LitElement {
  static styles = css`
    ${unsafeCSS(styles)}
  `;

  @property({ type: Object }) feature?: Feature;
  @property({ type: String }) itemStyle: "selected" | "picked" | "default" = "default";
  @property({ type: String }) showPlaceType: ShowPlaceType = "if-needed";
  @property({ attribute: false }) missingIconsCache: Set<string> = new Set<string>();
  @property({ type: String }) iconsBaseUrl: string = "";

  get #categories() {
    return this.feature?.properties?.categories;
  }
  get #isReverse() {
    return this.feature?.place_type[0] === "reverse";
  }
  get #placeType() {
    return this.feature?.properties?.categories?.join(", ") ?? this.feature?.place_type_name?.[0] ?? this.feature?.place_type[0];
  }

  @state() private category: string | undefined;
  @state() private imageUrl: string | undefined;
  @state() private spriteIcon: SpriteIcon | undefined;
  @state() private index: number = 0;

  #loadSprites() {
    spritePromise ??= fetch(`${this.iconsBaseUrl}sprite${scaleUrl}.json`)
      .then((response) => response.json())
      .then((data) => {
        sprites = data;
      })
      .catch(() => {
        sprites = null;
      });
  }

  #handleImgError() {
    if (this.imageUrl) {
      this.missingIconsCache.add(this.imageUrl);
    }

    this.#loadIcon();
  }

  #loadIcon() {
    if (sprites !== undefined) {
      this.#loadIcon2();
    } else {
      this.#loadSprites();

      void spritePromise?.then(() => {
        this.#loadIcon2();
      });
    }
  }

  #loadIcon2() {
    do {
      this.index--;

      this.category = this.#categories?.[this.index];

      this.spriteIcon = this.category ? sprites?.icons[this.category] : undefined;

      if (this.spriteIcon) {
        break;
      }

      this.imageUrl = this.category ? this.iconsBaseUrl + this.category.replace(/ /g, "_") + ".svg" : undefined;
    } while (this.index > -1 && (!this.imageUrl || this.missingIconsCache.has(this.imageUrl)));
  }

  willUpdate(changedProperties: Map<string, unknown>) {
    if (changedProperties.has("feature") && this.#categories) {
      this.index = this.#categories.length;
      this.#loadIcon();
    }
  }

  render() {
    return html`
      <li
        tabindex="-1"
        role="option"
        aria-selected=${this.itemStyle === "selected"}
        aria-checked=${this.itemStyle === "picked"}
        class=${this.itemStyle}
        @click=${() => this.dispatchEvent(new CustomEvent("select"))}
      >
        ${sprites && this.spriteIcon
          ? html`
              <div
                class="sprite-icon"
                style=${styleMap({
                  width: `${this.spriteIcon.width / scaleFactor}px`,
                  height: `${this.spriteIcon.height / scaleFactor}px`,
                  backgroundImage: `url(${this.iconsBaseUrl}sprite${scaleUrl}.png)`,
                  backgroundPosition: `-${this.spriteIcon.x / scaleFactor}px -${this.spriteIcon.y / scaleFactor}px`,
                  backgroundSize: `${sprites.width / scaleFactor}px ${sprites.height / scaleFactor}px`,
                })}
                title=${this.#placeType}
              />
            `
          : this.imageUrl
            ? html` <img src=${this.imageUrl} alt=${this.category} title=${this.#placeType} @error=${this.#handleImgError} />`
            : this.feature?.address
              ? html` <img src=${this.iconsBaseUrl + "housenumber.svg"} alt=${this.#placeType} title=${this.#placeType} /> `
              : this.feature?.id.startsWith("road.")
                ? html` <img src=${this.iconsBaseUrl + "road.svg"} alt=${this.#placeType} title=${this.#placeType} /> `
                : this.feature?.id.startsWith("address.")
                  ? html` <img src=${this.iconsBaseUrl + "street.svg"} alt=${this.#placeType} title=${this.#placeType} /> `
                  : this.feature?.id.startsWith("postal_code.")
                    ? html` <img src=${this.iconsBaseUrl + "postal_code.svg"} alt=${this.#placeType} title=${this.#placeType} /> `
                    : this.feature?.id.startsWith("poi.")
                      ? html` <img src=${this.iconsBaseUrl + "poi.svg"} alt=${this.#placeType} title=${this.#placeType} /> `
                      : this.#isReverse
                        ? html` <img src=${this.iconsBaseUrl + "reverse.svg"} alt=${this.#placeType} title=${this.#placeType} /> `
                        : html` <img src=${this.iconsBaseUrl + "area.svg"} alt=${this.#placeType} title=${this.#placeType} /> `}

        <span class="texts">
          <span>
            <span class="primary"> ${this.#isReverse ? this.feature?.place_name : this.feature?.place_name.replace(/,.*/, "")} </span>

            ${this.showPlaceType === "always" ||
            (this.showPlaceType !== "never" &&
              !this.feature?.address &&
              !this.feature?.id.startsWith("road.") &&
              !this.feature?.id.startsWith("address.") &&
              !this.feature?.id.startsWith("postal_code.") &&
              (!this.feature?.id.startsWith("poi.") || !this.imageUrl) &&
              !this.#isReverse)
              ? html` <span class="secondary"> ${this.#placeType} </span> `
              : nothing}
          </span>

          <span class="line2"> ${this.#isReverse ? "" : this.feature?.place_name.replace(/[^,]*,?s*/, "")} </span>
        </span>
      </li>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "maptiler-geocoder-feature-item": MaptilerGeocoderFeatureItemElement;
  }
}
