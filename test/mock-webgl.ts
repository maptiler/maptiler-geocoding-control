/* eslint-disable @typescript-eslint/no-empty-function, @typescript-eslint/no-explicit-any, @typescript-eslint/no-extraneous-class, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */

const realWebGL2Prototype = globalThis.WebGL2RenderingContext.prototype;
const webGL2MethodOverrides: Record<string, () => unknown> = {
  getProgramParameter: () => true,
  getShaderParameter: () => true,
};
globalThis.WebGL2RenderingContext = class WebGL2RenderingContextMock {} as any;
globalThis.HTMLCanvasElement.prototype.getContext = () =>
  new Proxy(new WebGL2RenderingContext(), {
    get(target, prop, receiver) {
      if (typeof prop === "string" && prop in webGL2MethodOverrides) {
        return webGL2MethodOverrides[prop];
      }
      if (typeof Object.getOwnPropertyDescriptor(realWebGL2Prototype, prop)?.value === "function") {
        return () => {};
      }
      return Reflect.get(target, prop, receiver);
    },
  }) as any;
