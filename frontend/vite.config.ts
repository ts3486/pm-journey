import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  envPrefix: "VITE_",
  server: {
    port: 5173,
    host: "127.0.0.1",
    warmup: {
      clientFiles: ["./index.html", "./src/main.tsx", "./src/styles.css"],
    },
  },
});
