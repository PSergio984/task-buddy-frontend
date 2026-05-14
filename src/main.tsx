import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import "react-datepicker/dist/react-datepicker.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { AuthProvider } from "@/contexts/AuthContext.tsx"
import { registerSW } from 'virtual:pwa-register'

if ("serviceWorker" in navigator) {
  registerSW({
    onNeedRefresh() {},
    onOfflineReady() {},
  })
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </AuthProvider>
  </StrictMode>
)
