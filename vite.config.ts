import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "task-buddy-icon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "Task Buddy",
        short_name: "TaskBuddy",
        description: "Premium Executive Task Management",
        theme_color: "#0F172A",
        background_color: "#0F172A",
        display: "standalone",
        icons: [
          {
            src: "task-buddy-icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
          {
            src: "task-buddy-icon.svg",
            sizes: "192x192",
            type: "image/svg+xml",
          },
          {
            src: "task-buddy-icon.svg",
            sizes: "512x512",
            type: "image/svg+xml",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "localhost",
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
})
