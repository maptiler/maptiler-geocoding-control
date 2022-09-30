import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  build: {
    lib: {
      fileName: "maptiler-geocoding",
      entry: "src/lib/index.ts",
      formats: ["es", "cjs"]
    },
  },
});
