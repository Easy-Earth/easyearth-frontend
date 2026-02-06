// vite.config.js
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  define: {
    global: 'window',
  },
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
      // ✅ [복구] 파일 리소스 접근을 위한 프록시 (이미지, 파일)
      // /chat/file/... 요청은 백엔드 리소스 핸들러로 전달
      '/chat/file': {
        target: 'http://localhost:8080/spring', 
        changeOrigin: true,
        secure: false,
      },

    },
  },
});