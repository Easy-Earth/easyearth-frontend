// vite.config.js
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        rewrite: (path) => "/spring" + path,
      },
      "/attendance": {
        target: "http://localhost:8080",
        changeOrigin: true,
        rewrite: (path) => "/spring" + path,
      },
      // 현재 요청 URL이 /spring으로 시작하는 경우
      "/spring": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
