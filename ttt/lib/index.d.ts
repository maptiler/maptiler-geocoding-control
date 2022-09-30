import type { Map, IControl } from 'maplibre-gl';
export declare class GeocodingControl implements IControl {
    #private;
    constructor({ apiKey }: {
        apiKey: string;
    });
    onAdd(map: Map): HTMLDivElement;
    onRemove(): void;
}
