import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import devServer from "@hono/vite-dev-server";

export default defineConfig({
  plugins: [
    react(),
    devServer({
      entry: "api/boot.ts",
      exclude: [/^\/public\//, /^\/dist\//, /^\/.+\.html/],
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@db": path.resolve(__dirname, "./db"),
      "@contracts": path.resolve(__dirname, "./contracts"),
    },
  },
  build: {
    outDir: "dist/public",
    emptyOutDir: true,
  },
  envDir: path.resolve(__dirname),
});
