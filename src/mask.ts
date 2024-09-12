import clone from "@turf/clone";
import difference from "@turf/difference";
import { featureCollection, polygon } from "@turf/helpers";
import type {
  Feature,
  FeatureCollection,
  MultiPolygon,
  Polygon,
  Position,
} from "geojson";

// see https://maplibre.org/maplibre-gl-js-docs/example/line-across-180th-meridian/
function fixRing(ring: Position[]) {
  let prev: Position | undefined = undefined;

  for (const c of ring) {
    if (prev && c[0] - prev[0] >= 180) {
      c[0] -= 360;
    } else if (prev && c[0] - prev[0] < -180) {
      c[0] += 360;
    }

    prev = c;
  }
}

export function setMask(
  picked: Feature<Polygon | MultiPolygon>,
  setData: (data: FeatureCollection<Polygon | MultiPolygon>) => void,
) {
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

  diff.properties = { isMask: "y" };

  const fixed = clone(picked);

  if (!fixed) {
    return;
  }

  if (fixed.geometry.type === "Polygon") {
    for (const ring of fixed.geometry.coordinates) {
      fixRing(ring);
    }
  } else {
    for (const poly of fixed.geometry.coordinates) {
      for (const ring of poly) {
        fixRing(ring);
      }
    }
  }

  setData(featureCollection([fixed, diff]));
}
