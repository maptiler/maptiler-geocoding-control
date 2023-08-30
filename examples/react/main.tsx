import { createElement, useEffect, useRef, useState } from "react";
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

  const consoleRef = useRef<HTMLPreElement | null>(null);

  const [collapsed, setCollapsed] = useState<boolean>(false);

  const [clearOnBlur, setClearOnBlur] = useState<boolean>(false);

  return (
    <div>
      <div className="control-bar">
        <GeocodingControl
          ref={ref}
          placeholder="What would you like to search?"
          clearButtonTitle="Clear me!"
          errorMessage="Boo!"
          noResultsMessage="No such place found!"
          apiKey={apiKey}
          collapsed={collapsed}
          onSelect={(data) => {
            console.log("select", data);
            consoleRef.current!.innerText += "select\n";
          }}
          onPick={(data) => {
            console.log("pick", data);
            consoleRef.current!.innerText += "pick\n";
          }}
          onFeaturesListed={(data) => {
            console.log("featuresListed", data);
            consoleRef.current!.innerText += "featuresListed\n";
          }}
          onFeaturesMarked={(data) => {
            console.log("featuresMarked", data);
            consoleRef.current!.innerText += "featuresMarked\n";
          }}
          onOptionsVisibilityChange={(data) => {
            console.log("optionsVisibilityChange", data);
            consoleRef.current!.innerText += "optionsVisibilityChange\n";
          }}
          onQueryChange={(data) => {
            console.log("queryChange", data);
            consoleRef.current!.innerText += "queryChange\n";
          }}
          onReverseToggle={(data) => {
            console.log("reverseToggle", data);
            consoleRef.current!.innerText += "reverseToggle\n";
          }}
          onResponse={(data) => {
            console.log("response", data);
            consoleRef.current!.innerText += "response\n";
          }}
          clearOnBlur={clearOnBlur}
          iconsBaseUrl="/icons/"
        />

        <label>
          <input
            type="checkbox"
            checked={collapsed}
            onChange={(e) => setCollapsed(e.currentTarget.checked)}
          />
          Collapse empty on blur
        </label>

        <label>
          <input
            type="checkbox"
            checked={clearOnBlur}
            onChange={(e) => setClearOnBlur(e.currentTarget.checked)}
          />
          Clear on blur
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

      <pre ref={consoleRef}></pre>
    </div>
  );
}

root.render(createElement(App));
