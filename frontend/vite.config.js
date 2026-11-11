import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const API = "http://127.0.0.1:8000";

export default defineConfig({
  base: "./",
  plugins: [react()],
  // Готовий сайт збирається в папку backend/static, звідки його віддає FastAPI
  build: { outDir: "../backend/static", emptyOutDir: true },
  // Під час розробки запити до API йдуть на сервер FastAPI
  server: {
    proxy: {
      "/api": API,
      "/docs": API,
      "/openapi.json": API,
    },
  },
});
