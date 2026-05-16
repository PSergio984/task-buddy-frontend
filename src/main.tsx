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
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { get, set, del } from "idb-keyval"

if ("serviceWorker" in globalThis.navigator) {
  registerSW({
    onNeedRefresh() {},
    onOfflineReady() {},
  })
}

// Create IndexedDB persister
const persister = createAsyncStoragePersister({
  storage: {
    getItem: (key) => get(key),
    setItem: (key, value) => set(key, value),
    removeItem: (key) => del(key),
  },
})

createRoot(globalThis.document.getElementById("root")!).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ 
        persister,
        buster: "v1", // Cache buster for schema changes
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
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
