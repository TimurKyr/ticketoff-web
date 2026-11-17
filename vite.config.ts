import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // The API allows CORS only from ticketoff.store, so in dev point
      // VITE_API_BASE_URL at /api and let Vite forward the requests.
      "/api": {
        target: process.env.API_PROXY_TARGET ?? "https://api.ticketoff.store",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ""),
      },
    },
  },
});
