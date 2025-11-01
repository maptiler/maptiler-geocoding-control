import { LitElement, css, svg } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("maptiler-geocode-clear-icon")
export class MaptilerGeocodeClearIconElement extends LitElement {
  static styles = css`
    svg {
      display: block;
      fill: var(--color-icon-button);
    }
  `;

  render() {
    return svg`
      <svg viewBox="0 0 14 14" width="13" height="13">
        <path
          d="M13.12.706a.982.982 0 0 0-1.391 0L6.907 5.517 2.087.696a.982.982 0 1 0-1.391 1.39l4.821 4.821L.696 11.73a.982.982 0 1 0 1.39 1.39l4.821-4.821 4.822 4.821a.982.982 0 1 0 1.39-1.39L8.298 6.908l4.821-4.822a.988.988 0 0 0 0-1.38Z"
        />
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "maptiler-geocode-clear-icon": MaptilerGeocodeClearIconElement;
  }
}
