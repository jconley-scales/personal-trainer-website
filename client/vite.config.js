import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Forward API calls to the Express server during development so the
    // client can just call fetch("/api/...") without hardcoding a host.
    proxy: {
      "/api": "http://localhost:4000",
    },
  },
});
