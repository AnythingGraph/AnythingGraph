import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite configuration for the ag-cli dashboard (React, JavaScript only).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
});
