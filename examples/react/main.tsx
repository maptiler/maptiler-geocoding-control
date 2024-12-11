import * as maptilersdk from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";
import { createElement, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import type { EnableReverse } from "src/types";
import { createMapLibreGlMapController } from "../../src/maplibregl-controller";
import { GeocodingControl, type Methods } from "../../src/react";

const appElement = document.getElementById("app");

if (!appElement) {
  throw new Error("element with id 'app' not found");
}

const apiKey = import.meta.env.VITE_API_KEY;

if (!apiKey) {
  const errMsg = "missing VITE_API_KEY environment variable";

  window.alert(errMsg);

  throw new Error(errMsg);
}

maptilersdk.config.apiKey = apiKey;

const root = createRoot(appElement);

function App() {
  const ref = useRef<Methods>(null);

  const consoleRef = useRef<HTMLDivElement | null>(null);

  const [collapsed, setCollapsed] = useState(false);

  const [reverse, setReverse] = useState<EnableReverse>("never");

  const [clearOnBlur, setClearOnBlur] = useState(false);

  const [clearListOnPick, setClearListOnPick] = useState(false);

  const [keepListOpen, setKeepListOpen] = useState(false);

  const [flyToSelected, setFlyToSelected] = useState(false);

  const [selectFirst, setSelectFirst] = useState(true);

  const map = useRef<maptilersdk.Map | null>(null);

  const mapContainer = useRef<HTMLDivElement | null>(null);

  const [mapController, setMapController] = useState<ReturnType<
    typeof createMapLibreGlMapController
  > | null>(null);

  useEffect(() => {
    if (map.current || !mapContainer.current) {
      return;
    }

    map.current = new maptilersdk.Map({
      container: mapContainer.current,
      style: maptilersdk.MapStyle.STREETS,
      center: [15, 49],
      zoom: 8,
    });

    setMapController(createMapLibreGlMapController(map.current, maptilersdk));
  }, []);

  function log(action: string, data: unknown) {
    const el = consoleRef.current;

    if (!el) {
      return;
    }

    console.log(action, data);

    const actionDiv = document.createElement("div");
    actionDiv.appendChild(document.createTextNode(action));
    el.appendChild(actionDiv);

    const dataDiv = document.createElement("div");
    dataDiv.appendChild(document.createTextNode(JSON.stringify(data)));
    el.appendChild(dataDiv);

    (el.parentElement as HTMLDivElement).scrollTo(0, el.scrollHeight);
  }

  return (
    <>
      <div className="row">
        <div className="col-12 card control-bar">
          {mapController && (
            <GeocodingControl
              ref={ref}
              apiKey={apiKey}
              mapController={mapController}
              placeholder="What would you like to find?"
              clearButtonTitle="Clear me!"
              errorMessage="Boo!"
              noResultsMessage="No such place found!"
              collapsed={collapsed}
              onSelect={(data) => log("select", data)}
              onPick={(data) => log("pick", data)}
              onFeaturesListed={(data) => log("featuresListed", data)}
              onFeaturesMarked={(data) => log("featuresMarked", data)}
              onOptionsVisibilityChange={(data) =>
                log("optionsVisibilityChange", data)
              }
              onQueryChange={(data) => log("queryChange", data)}
              onReverseToggle={(data) => log("reverseToggle", data)}
              onResponse={(data) => log("response", data)}
              clearOnBlur={clearOnBlur}
              clearListOnPick={clearListOnPick}
              keepListOpen={keepListOpen}
              iconsBaseUrl="/icons/"
              enableReverse={reverse}
              flyToSelected={flyToSelected}
              selectFirst={selectFirst}
            />
          )}

          <label>
            <input
              type="checkbox"
              checked={collapsed}
              onChange={(e) => setCollapsed(e.currentTarget.checked)}
            />
            <span className="checkable">Collapse empty on blur</span>
          </label>

          <label>
            <input
              type="checkbox"
              checked={clearOnBlur}
              onChange={(e) => setClearOnBlur(e.currentTarget.checked)}
            />
            <span className="checkable">Clear on blur</span>
          </label>

          <label>
            <input
              type="checkbox"
              checked={clearListOnPick}
              onChange={(e) => setClearListOnPick(e.currentTarget.checked)}
            />
            <span className="checkable">Clear list on pick</span>
          </label>

          <label>
            <input
              type="checkbox"
              checked={selectFirst}
              onChange={(e) => setSelectFirst(e.currentTarget.checked)}
            />
            <span className="checkable">Select first</span>
          </label>

          <label>
            <input
              type="checkbox"
              checked={flyToSelected}
              onChange={(e) => setFlyToSelected(e.currentTarget.checked)}
            />
            <span className="checkable">Fly to selected</span>
          </label>

          <label>
            <input
              type="checkbox"
              checked={keepListOpen}
              onChange={(e) => setKeepListOpen(e.currentTarget.checked)}
            />
            <span className="checkable">Keep the list open</span>
          </label>

          <label>
            <select
              value={reverse}
              onChange={(e) =>
                setReverse(e.currentTarget.value as EnableReverse)
              }
            >
              <option value="button">Enable reverse</option>
              <option value="always">Always reverse</option>
              <option value="never">Disable reverse</option>
            </select>
          </label>

          <button type="button" onClick={() => ref.current?.focus()}>
            Focus
          </button>

          <button type="button" onClick={() => ref.current?.blur()}>
            Blur
          </button>

          <button type="button" onClick={() => ref.current?.setQuery("")}>
            Clear
          </button>

          <button
            type="button"
            onClick={() => {
              ref.current?.setQuery("Košice", true);
              ref.current?.focus();
            }}
          >
            Search Košice
          </button>
        </div>
      </div>

      <div className="row flex-grow">
        <div className="col-6 card flex-grow overflow-auto">
          <div className="logs" ref={consoleRef} />
        </div>

        <div className="col-6 card" ref={mapContainer} />
      </div>
    </>
  );
}

root.render(createElement(App));
