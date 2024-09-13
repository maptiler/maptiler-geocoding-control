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
      const bb = bbox(poly);

      // bigger features (continents, oceans) have bigger tolerance
      const tolerance = (bb[2] - bb[0]) / 360 / 1_000;

      if (bb[0] < -180 + tolerance) {
        for (const ring of poly.geometry.coordinates) {
          for (const position of ring) {
            position[0] += 360 - tolerance;
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
