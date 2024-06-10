import App from "./AppMapTilerSdk.svelte";

const appElement = document.getElementById("app");

if (!appElement) {
  throw new Error("element with id 'app' not found");
}

export default new App({ target: appElement });
