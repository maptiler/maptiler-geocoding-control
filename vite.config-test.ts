import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    typecheck: {
      tsconfig: "./tsconfig.json",
    },
    browser: {
      provider: playwright(),
      enabled: true,
      headless: true,
      instances: [{ browser: "chromium" }],
    },
    globals: true,
    setupFiles: ["./vitest-setup-tests.ts"],
  },
});
