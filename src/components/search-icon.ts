import { LitElement, css, svg } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("maptiler-geocode-search-icon")
export class MaptilerGeocodeSearchIconElement extends LitElement {
  static styles = css`
    circle {
      stroke-width: 1.875;
      fill: none;
    }

    path {
      stroke-width: 1.875;
      stroke-linecap: round;
    }

    svg {
      display: block;
      stroke: var(--color-icon-button);
    }
  `;

  render() {
    return svg`
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="13"
        height="13"
        viewBox="0 0 13 13"
      >
        <circle cx="4.789" cy="4.787" r="3.85" />
        <path d="M12.063 12.063 7.635 7.635" />
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "maptiler-geocode-search-icon": MaptilerGeocodeSearchIconElement;
  }
}
