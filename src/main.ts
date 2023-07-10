import App from "./AppOpenLayers.svelte";

// import {
//   createElement,
//   useEffect,
//   useLayoutEffect,
//   useRef,
//   useState,
// } from "react";
// import { createRoot } from "react-dom/client";
// import {
//   ReactGeocodingControl,
//   type Methods,
// } from "./lib/ReactGeocodingControl";

const appElement = document.getElementById("app");

if (!appElement) {
  throw new Error("element with id 'app' not found");
}

const app = new App({
  target: appElement,
});

export default app;

// const apiKey = import.meta.env.VITE_API_KEY;

// if (!apiKey) {
//   const errMsg = "missing VITE_API_KEY environment variable";

//   window.alert(errMsg);

//   throw new Error(errMsg);
// }

// const root = createRoot(appElement);

// function App() {
//   const ref = useRef<Methods>(null);

//   const [collapsed, setCollapsed] = useState(false);

//   useEffect(() => {
//     setTimeout(() => {
//       ref.current?.focus();
//     });

//     setTimeout(() => {
//       setCollapsed(true);
//     }, 5000);
//   }, []);

//   return createElement(ReactGeocodingControl, {
//     ref,
//     apiKey,
//     collapsed,
//     onSelect: (f) => {
//       console.log("select", f);
//     },
//   });
// }

// root.render(createElement(App));
