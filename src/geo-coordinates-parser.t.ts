declare module "geo-coordinates-parser" {
  export function convert(
    input: string,
    decimalPlaces: number,
  ): {
    decimalLatitude: number;
    decimalLongitude: number;
    verbatimLatitude: string;
    verbatimLongitude: string;
  };
}
