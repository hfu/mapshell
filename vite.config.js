import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  build: {
    outDir: "docs",
    emptyOutDir: false,
    cssCodeSplit: false,
    sourcemap: false
  },
  plugins: [viteSingleFile()],
  server: {
    host: true
  },
  preview: {
    host: true
  }
});
