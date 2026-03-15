import { copyFile } from "node:fs/promises";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const copyCommandParser = () => ({
  name: "copy-command-parser",
  async closeBundle() {
    await copyFile("src/command_parser.js", "docs/commandParser.js");
  }
});

export default defineConfig({
  build: {
    outDir: "docs",
    emptyOutDir: true,
    cssCodeSplit: false,
    sourcemap: false
  },
  plugins: [viteSingleFile(), copyCommandParser()],
  server: {
    host: true
  },
  preview: {
    host: true
  }
});
