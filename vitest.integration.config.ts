import { defineConfig } from "vitest/config";
import { workflow } from "@workflow/vitest";
import path from "node:path";

export default defineConfig({
  plugins: [workflow()],
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
  test: {
    include: ["test/integration/**/*.integration.test.ts"],
    testTimeout: 60_000,
    environment: "node",
  },
});
