import { LitElement, css, svg } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("maptiler-geocode-fail-icon")
export class MaptilerGeocodeFailIconElement extends LitElement {
  /** @internal */
  static styles = css`
    svg {
      display: block;
      fill: #e15042;
    }
  `;

  render() {
    return svg`
      <svg viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M15 0C6.705 0 0 6.705 0 15C0 23.295 6.705 30 15 30C23.295 30 30 23.295 30 15C30 6.705 23.295 0 15 0ZM22.5 20.385L20.385 22.5L15 17.115L9.615 22.5L7.5 20.385L12.885 15L7.5 9.615L9.615 7.5L15 12.885L20.385 7.5L22.5 9.615L17.115 15L22.5 20.385Z"
        />
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "maptiler-geocode-fail-icon": MaptilerGeocodeFailIconElement;
  }
}
