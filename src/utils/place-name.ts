import type { Feature } from "../types";

/** Splits `place_name` into the primary part and the remaining parts. */
export function getPlaceNameParts(feature: Pick<Feature, "place_name" | "text" | "address">): { primary: string; rest: string } {
  const parts = feature.place_name
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const { text, address } = feature;
  const exactMatches = address ? [`${text} ${address}`, `${address} ${text}`] : [text];
  const exactIndex = exactMatches.map((match) => parts.indexOf(match)).find((index) => index > -1);
  const index = Math.max(0, exactIndex ?? parts.findIndex((part) => part.includes(text)));
  return { primary: parts[index] ?? "", rest: parts.filter((_, i) => i !== index).join(", ") };
}
