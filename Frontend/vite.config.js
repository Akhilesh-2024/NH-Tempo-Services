import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/",
  server:{
    proxy:{
      '/api':{
        target:"http://localhost:5003",
        changeOrigin:true,
        secure:false,
      }
    }
  },
    build: {
    chunkSizeWarningLimit: 1000 // in KB
  }
});