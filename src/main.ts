import App from "./AppLeaflet.svelte";

const appElement = document.getElementById("app");

if (!appElement) {
  throw new Error("element with id 'app' not found");
}

const app = new App({
  target: appElement,
});

export default app;
