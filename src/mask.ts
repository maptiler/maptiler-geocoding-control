import buffer from "@turf/buffer";
import difference from "@turf/difference";
import type {
  MultiPolygon,
  Polygon,
  Position,
  Feature as TurfFeature,
} from "@turf/helpers";
import type { FeatureCollection } from "geojson";

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
  picked: TurfFeature<Polygon | MultiPolygon>,
  setData: (data: FeatureCollection<Polygon | MultiPolygon>) => void
) {
  const diff = difference(
    {
      type: "Polygon",
      coordinates: [
        [
          [180, 90],
          [-180, 90],
          [-180, -90],
          [180, -90],
          [180, 90],
        ],
      ],
    },
    picked
  );

  if (!diff) {
    return;
  }

  diff.properties = { isMask: "y" };

  const fixed = buffer(picked, 0);

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

  setData({
    type: "FeatureCollection",
    features: [fixed, diff],
  });
}
