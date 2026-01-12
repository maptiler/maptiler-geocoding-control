import { MapStyle, Map as SDKMap, config } from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";
import { createElement, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

import { GeocodingControl, type EnableReverse } from "../../src/maptilersdk";
import { getApiKey } from "./demo-utils";

const appElement = document.getElementById("app");

if (!appElement) {
  throw new Error("element with id 'app' not found");
}

config.apiKey = getApiKey();

const root = createRoot(appElement);

function App() {
  const consoleRef = useRef<HTMLDivElement | null>(null);

  const [collapsed, setCollapsed] = useState(false);

  const [enableReverse, setEnableReverse] = useState<EnableReverse>("always");

  const [clearOnBlur, setClearOnBlur] = useState(false);

  const [clearListOnPick, setClearListOnPick] = useState(false);

  const [keepListOpen, setKeepListOpen] = useState(false);

  const [flyToSelected, setFlyToSelected] = useState(false);

  const [selectFirst, setSelectFirst] = useState(true);

  const control = useRef<GeocodingControl>(null);

  const map = useRef<SDKMap | null>(null);

  const mapContainer = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (map.current || control.current || !mapContainer.current) {
      return;
    }

    map.current = new SDKMap({
      container: mapContainer.current,
      style: MapStyle.STREETS,
      center: [15, 49],
      zoom: 8,
    });

    control.current = new GeocodingControl({
      placeholder: "What would you like to find?",
      clearButtonTitle: "Clear me!",
      errorMessage: "Boo!",
      noResultsMessage: "No such place found!",
      // reverseGeocodingLimit: 5,
      // reverseGeocodingTypes: ["address"],
      iconsBaseUrl: "/assets/icons/",
    });

    control.current.on("reversetoggle", (data) => {
      log("reversetoggle", data);
    });
    control.current.on("querychange", (data) => {
      log("querychange", data);
    });
    control.current.on("queryclear", (data) => {
      log("queryclear", data);
    });
    control.current.on("request", (data) => {
      log("request", data);
    });
    control.current.on("response", (data) => {
      log("response", data);
    });
    control.current.on("select", (data) => {
      log("select", data);
    });
    control.current.on("pick", (data) => {
      log("pick", data);
    });
    control.current.on("featuresshow", (data) => {
      log("featuresshow", data);
    });
    control.current.on("featureshide", (data) => {
      log("featureshide", data);
    });
    control.current.on("featureslisted", (data) => {
      log("featureslisted", data);
    });
    control.current.on("featuresclear", (data) => {
      log("featuresclear", data);
    });

    map.current.addControl(control.current);
  }, []);

  useEffect(() => {
    control.current?.setOptions({ collapsed });
  }, [collapsed]);

  useEffect(() => {
    control.current?.setOptions({ clearOnBlur });
  }, [clearOnBlur]);

  useEffect(() => {
    control.current?.setOptions({ clearListOnPick });
  }, [clearListOnPick]);

  useEffect(() => {
    control.current?.setOptions({ keepListOpen });
  }, [keepListOpen]);

  useEffect(() => {
    control.current?.setOptions({ enableReverse });
  }, [enableReverse]);

  useEffect(() => {
    control.current?.setOptions({ flyToSelected });
  }, [flyToSelected]);

  useEffect(() => {
    control.current?.setOptions({ selectFirst });
  }, [selectFirst]);

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

    el.parentElement?.scrollTo(0, el.scrollHeight);
  }

  return (
    <>
      <div className="row">
        <div className="col-12 card control-bar">
          <label>
            <input
              type="checkbox"
              checked={collapsed}
              onChange={(e) => {
                setCollapsed(e.currentTarget.checked);
              }}
            />
            <span className="checkable">Collapse empty on blur</span>
          </label>

          <label>
            <input
              type="checkbox"
              checked={clearOnBlur}
              onChange={(e) => {
                setClearOnBlur(e.currentTarget.checked);
              }}
            />
            <span className="checkable">Clear on blur</span>
          </label>

          <label>
            <input
              type="checkbox"
              checked={clearListOnPick}
              onChange={(e) => {
                setClearListOnPick(e.currentTarget.checked);
              }}
            />
            <span className="checkable">Clear list on pick</span>
          </label>

          <label>
            <input
              type="checkbox"
              checked={selectFirst}
              onChange={(e) => {
                setSelectFirst(e.currentTarget.checked);
              }}
            />
            <span className="checkable">Select first</span>
          </label>

          <label>
            <input
              type="checkbox"
              checked={flyToSelected}
              onChange={(e) => {
                setFlyToSelected(e.currentTarget.checked);
              }}
            />
            <span className="checkable">Fly to selected</span>
          </label>

          <label>
            <input
              type="checkbox"
              checked={keepListOpen}
              onChange={(e) => {
                setKeepListOpen(e.currentTarget.checked);
              }}
            />
            <span className="checkable">Keep the list open</span>
          </label>

          <label>
            <select
              value={enableReverse}
              onChange={(e) => {
                setEnableReverse(e.currentTarget.value as EnableReverse);
              }}
            >
              <option value="button">Enable reverse</option>
              <option value="always">Always reverse</option>
              <option value="never">Disable reverse</option>
            </select>
          </label>

          <button type="button" onClick={() => control.current?.focus()}>
            Focus
          </button>

          <button type="button" onClick={() => control.current?.blur()}>
            Blur
          </button>

          <button type="button" onClick={() => control.current?.setQuery("")}>
            Clear
          </button>

          <button
            type="button"
            onClick={() => {
              control.current?.submitQuery("Košice");
              control.current?.focus();
            }}
          >
            Search Košice
          </button>
        </div>
      </div>

      <div className="row flex-grow">
        <div className="col-6 card flex-grow overflow-auto">
          <div>
            <b>Logs</b>&emsp;
            <button type="button" className="is-small" onClick={() => consoleRef.current && (consoleRef.current.innerText = "")}>
              Clear
            </button>
          </div>

          <div className="logs" ref={consoleRef} />
        </div>

        <div className="col-6 card" ref={mapContainer} />
      </div>
    </>
  );
}

root.render(createElement(App));
