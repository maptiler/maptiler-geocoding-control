import type { BBox } from "./types";

// taken from Leaflet
export function wrapNum(
  x: number,
  range: [number, number],
  includeMax: boolean,
) {
  const max = range[1],
    min = range[0],
    d = max - min;

  return x === max && includeMax ? x : ((((x - min) % d) + d) % d) + min;
}

export function unwrapBbox(bbox0: BBox): BBox {
  const bbox = [...bbox0] satisfies BBox;

  if (bbox[2] < bbox[0]) {
    if (
      Math.abs((bbox[0] + bbox[2] + 360) / 2) >
      Math.abs((bbox[0] - 360 + bbox[2]) / 2)
    ) {
      bbox[0] -= 360;
    } else {
      bbox[2] += 360;
    }
  }

  return bbox;
}
