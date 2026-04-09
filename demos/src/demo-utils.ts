/**
 * Gets the MapTiler API key for the SDK.
 * If you don't want to use the URL parameter, you can set the key directly in the code.
 */
export function getApiKey(): string {
  const apiKey: string = import.meta.env.VITE_API_KEY ?? localStorage.getItem("MT_DEMO_API_KEY") ?? "API_KEY";

  if (apiKey === "API_KEY") {
    const urlParams = new URLSearchParams(window.location.search);
    const apiKey = urlParams.get("key");
    if (apiKey) {
      localStorage.setItem("MT_DEMO_API_KEY", apiKey);
      return apiKey;
    } else {
      const errorMessage = "MapTiler API key is missing. Please use URL `key` parameter to set it (`?key=XXXXX`).";
      alert(errorMessage);
      throw new Error(errorMessage);
    }
  } else {
    return apiKey;
  }
}
