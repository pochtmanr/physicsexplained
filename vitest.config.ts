import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.{ts,tsx}", "components/**/*.test.{ts,tsx}", "app/**/*.test.{ts,tsx}"],
    setupFiles: ["./tests/setup/env.ts", "./tests/vitest.setup.ts"],
    globals: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
