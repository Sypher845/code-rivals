import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const executeProxyTarget =
    env.VITE_EXECUTE_PROXY_TARGET ?? "http://13.63.158.115";

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        "/api/v2/execute": {
          target: executeProxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
