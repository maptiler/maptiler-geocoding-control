import bbox from "@turf/bbox";
import difference from "@turf/difference";
import flatten from "@turf/flatten";
import { featureCollection, polygon } from "@turf/helpers";
import union from "@turf/union";
import type {
  Feature,
  FeatureCollection,
  MultiPolygon,
  Polygon,
} from "geojson";

export function setMask(
  picked: Feature<Polygon | MultiPolygon>,
  setData: (data?: FeatureCollection<Polygon | MultiPolygon>) => void,
): void {
  const diff = difference(
    featureCollection([
      polygon([
        [
          [180, 90],
          [-180, 90],
          [-180, -90],
          [180, -90],
          [180, 90],
        ],
      ]),
      picked,
    ]),
  );

  if (!diff) {
    return;
  }

  diff.properties = { isMask: true };

  const flattened = flatten(picked);

  if (flattened.features.length > 1) {
    for (const poly of flattened.features) {
      const b = bbox(poly);

      if (b[0] < -179.99999999) {
        for (const ring of poly.geometry.coordinates) {
          for (const pos of ring) {
            pos[0] += 359.999999;
          }
        }
      }
    }
  }

  setData(
    featureCollection([
      flattened.features.length < 2 ? picked : (union(flattened) ?? picked),
      diff,
    ]),
  );
}
