import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  server: {
    proxy: {
      "/yf": {
        target: "https://query1.finance.yahoo.com",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/yf/, ""),
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
          "Accept": "application/json, text/plain, */*",
          "Accept-Language": "en-US,en;q=0.9",
          "Referer": "https://finance.yahoo.com/",
          "Origin": "https://finance.yahoo.com",
        },
      },
    },
  },
});
