import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Integration tests share one database; running files in parallel would
    // make them delete each other's fixtures.
    fileParallelism: false,
    setupFiles: ["tests/setup.ts"],
  },
});
