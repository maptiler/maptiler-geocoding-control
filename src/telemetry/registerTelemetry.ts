import * as maptilersdk from "@maptiler/sdk";
import packagejson from "../../package.json";

/**
 * TODO: Remove when telemetry will be implemented
 */
declare module "@maptiler/sdk" {
  interface Map {
    telemetry: {
      registerModule: (name: string, version: string) => void;
    };
  }
}

maptilersdk.Map.prototype.telemetry = {
  registerModule: (name: string, version: string) => {
    console.log(`Telemetry module registered: ${name} ${version}`);
  },
};
/* *** */

const registeredMaps: Array<number> = [];

function registerTelemetry(map: maptilersdk.Map) {
  if (registeredMaps.includes(map._mapId)) {
    return;
  }

  map.telemetry.registerModule(packagejson.name, packagejson.version);

  registeredMaps.push(map._mapId);
}

export { registerTelemetry };
