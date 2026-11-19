/**
 * Makes the control class `Evented` by copying the methods of the `Evented` of the map library (MapLibre GL JS, MapTiler SDK or Leaflet),
 * so that the control can keep its own base class and the shared code doesn't depend on a particular map library.
 *
 * The constructor of `Evented` isn't run, so its methods must not depend on it (they initialize their state lazily).
 */
export function mixinEvented(controlClass: { prototype: object }, evented: { prototype: object }) {
  for (const name of Object.getOwnPropertyNames(evented.prototype)) {
    const descriptor = Object.getOwnPropertyDescriptor(evented.prototype, name);

    if (name !== "constructor" && descriptor) {
      Object.defineProperty(controlClass.prototype, name, descriptor);
    }
  }
}
