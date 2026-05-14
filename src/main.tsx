import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import "react-datepicker/dist/react-datepicker.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { AuthProvider } from "@/contexts/AuthContext.tsx"
import { registerSW } from 'virtual:pwa-register'

import { queryClient } from "@/lib/query-client"
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"
import { createPersister } from "@tanstack/react-query-persist-client"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { get, set, del } from "idb-keyval"

if ("serviceWorker" in navigator) {
  registerSW({
    onNeedRefresh() {},
    onOfflineReady() {},
  })
}

// Create IndexedDB persister
const persister = createPersister({
  storage: {
    getItem: (key) => get(key),
    setItem: (key, value) => set(key, value),
    removeItem: (key) => del(key),
  },
  buster: "v1", // Cache buster for schema changes
  maxAge: 1000 * 60 * 60 * 24, // 24 hours
})

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ 
        persister,
        // Exclude audit logs from persistence
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            const queryKey = query.queryKey as string[]
            return !queryKey.includes("audit-trail") && !queryKey.includes("stats")
          }
        }
      }}
    >
      <AuthProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </PersistQueryClientProvider>
  </StrictMode>
)
