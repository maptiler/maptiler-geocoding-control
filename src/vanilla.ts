import GC from "./GeocodingControl.svelte";
import type { ControlOptions, MapController } from "./types";

const finalizationRegistry = new FinalizationRegistry<GC>((gc) => {
  gc.$destroy();
});

type Options = ControlOptions & { mapController?: MapController };

export class GeocodingControl extends EventTarget {
  #gc: GC;

  constructor({ target, ...options }: Options & { target: HTMLElement }) {
    super();

    this.#gc = new GC({
      target,
      props: options,
    });

    for (const eventName of [
      "select",
      "pick",
      "featuresListed",
      "featuresMarked",
      "response",
      "optionsVisibilityChange",
      "reverseToggle",
      "queryChange",
    ] as const) {
      this.#gc.$on(eventName, (event) => this.dispatchEvent(event));
    }

    finalizationRegistry.register(this, this.#gc);
  }

  setOptions(options: Partial<Options>) {
    this.#gc.$set(options);
  }

  setQuery(value: string, submit = true) {
    this.#gc?.setQuery(value, submit);
  }

  clearMap() {
    this.#gc?.clearMap();
  }

  clearList() {
    this.#gc?.clearList();
  }

  focus() {
    this.#gc?.focus();
  }

  blur() {
    this.#gc?.blur();
  }
}
