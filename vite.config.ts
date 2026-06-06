import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Inject package.json version so the UI can show the running build (constraint: version-in-ui-and-changelog).
const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL("./package.json", import.meta.url)), "utf8"),
);

// https://vitejs.dev/config/
export default defineConfig({
  // The packaged app loads index.html over file:// — relative base keeps ./assets/ paths
  // resolving correctly instead of 404-ing against the filesystem root (constraint: vite-relative-base).
  base: "./",
  root: "renderer",
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    outDir: "../dist-renderer",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
