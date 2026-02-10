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
      // ✅ 중요: 현재 요청 URL이 /spring으로 시작하므로 이 설정을 추가합니다.
      '/spring': {
        target: 'http://localhost:8080', // Spring Boot 서버 주소
        changeOrigin: true,
        secure: false,
        ws: true,
        // 필요하다면 rewrite는 사용하지 않습니다. (Spring이 /spring을 가지고 있으므로)
      },
    },
  },
});