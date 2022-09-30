// Reexport your entry components here

import type { Map, IControl } from 'maplibre-gl';
import Geocoding from './Geocoding.svelte';

export class GeocodingControl implements IControl {
  #gc?: Geocoding;

  #apiKey: string;

  constructor({ apiKey }: { apiKey: string }) {
    this.#apiKey = apiKey;
  }

  onAdd(map: Map) {
    const div = document.createElement('div');

    div.className =
      'mapboxgl-ctrl-geocoder mapboxgl-ctrl maplibregl-ctrl-geocoder maplibregl-ctrl';

    this.#gc = new Geocoding({
      target: div,
      props: { map, apiKey: this.#apiKey }
    });

    return div;
  }

  onRemove() {
    this.#gc?.$destroy();
  }
}
