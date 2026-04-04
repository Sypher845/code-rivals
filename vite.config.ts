import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api/problemset": {
        target: "http://localhost:8080",
        changeOrigin: true,
        rewrite: () => "",
      },
      "/api/piston": {
        target: "http://localhost:2001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/piston/, ""),
      },
    },
  },
});
