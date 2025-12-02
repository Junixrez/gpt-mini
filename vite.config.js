import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Only expose VITE_* env variables to the client
  envPrefix: "VITE_",
  define: {
    // Ensure backend-only env vars are not exposed
    "process.env.MONGO_URI": undefined,
  },
});
