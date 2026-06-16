import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/e2e/**/*.spec.ts"],
    // E2E tests spawn real CLI processes, so they need longer timeouts.
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
