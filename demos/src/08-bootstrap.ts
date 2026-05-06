import "../../src";

import { getApiKey } from "./demo-utils";

for (const el of document.querySelectorAll("maptiler-geocoder")) {
  el.apiKey = getApiKey();
}
