import { createElement, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
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

const root = createRoot(appElement);

function App() {
  const ref = useRef<Methods>(null);

  const consoleRef = useRef<HTMLDivElement | null>(null);

  const [collapsed, setCollapsed] = useState<boolean>(false);

  const [clearOnBlur, setClearOnBlur] = useState<boolean>(false);

  function log(action: string, data: unknown) {
    const el = consoleRef.current;

    if (!el) {
      return;
    }

    console.log(action, data);
    el.innerText += action + "\n";
    el.scrollTo(0, el.scrollHeight);
  }

  return (
    <>
      <div className="card control-bar">
        <GeocodingControl
          ref={ref}
          placeholder="What would you like to search?"
          clearButtonTitle="Clear me!"
          errorMessage="Boo!"
          noResultsMessage="No such place found!"
          apiKey={apiKey}
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
          iconsBaseUrl="/icons/"
        />

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

      <div className="card console" ref={consoleRef} />
    </>
  );
}

root.render(createElement(App));
