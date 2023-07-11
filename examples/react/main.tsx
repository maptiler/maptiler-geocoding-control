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

  // const [collapsed, setCollapsed] = useState(false);

  // useEffect(() => {
  //   setTimeout(() => {
  //     ref.current?.focus();
  //   });

  //   setTimeout(() => {
  //     setCollapsed(true);
  //   }, 5000);
  // }, []);

  return (
    <GeocodingControl
      ref={ref}
      apiKey={apiKey}
      //collapsed
      onSelect={(f) => {
        console.log("select", f);
      }}
      iconsBaseUrl="/icons/"
    />
  );
}

root.render(createElement(App));
