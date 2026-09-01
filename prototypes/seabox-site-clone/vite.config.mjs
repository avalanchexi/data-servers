import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";

const htmlInputs = Object.fromEntries(
  fs.readdirSync(process.cwd())
    .filter((file) => file === "index.html" || /^\d{3}-.*\.html$/.test(file))
    .map((file) => [file.replace(/\.html$/, ""), path.resolve(process.cwd(), file)]),
);

export default defineConfig({
  base: "./",
  build: {
    outDir: "dist/client",
    rollupOptions: {
      input: htmlInputs,
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  plugins: [react()],
});
