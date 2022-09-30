// Reexport your entry components here
import Geocoding from './Geocoding.svelte';
export class GeocodingControl {
    #gc;
    #apiKey;
    constructor({ apiKey }) {
        this.#apiKey = apiKey;
    }
    onAdd(map) {
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
//# sourceMappingURL=index.js.map