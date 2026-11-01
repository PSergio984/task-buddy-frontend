"use client"

import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister"
import { get, set, del } from "idb-keyval"

import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/AuthContext"
import { SyncProvider } from "@/contexts/SyncContext"
import { GameProvider } from "@/contexts/GameContext"
import { FocusSessionProvider } from "@/contexts/FocusSessionContext"
import { queryClient } from "@/lib/query-client"

const persister = createAsyncStoragePersister({
  storage: {
    getItem: (key) => get(key),
    setItem: (key, value) => set(key, value),
    removeItem: (key) => del(key),
  },
})

export function AppProviders({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        buster: "v1",
        maxAge: 1000 * 60 * 60 * 24,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            const queryKey = query.queryKey as string[]
            // game-profile is deliberately NOT dehydrated: it's user-keyed,
            // so a persisted blob could flash the previous account's totals
            // on a shared browser before the auth context resolves — and a
            // fresh GET lands fast anyway.
            return (
              !queryKey.includes("audit-trail") &&
              !queryKey.includes("stats") &&
              !queryKey.includes("game-profile")
            )
          },
        },
      }}
    >
      <AuthProvider>
        <SyncProvider>
          <GameProvider>
            <FocusSessionProvider>
              <ThemeProvider>{children}</ThemeProvider>
            </FocusSessionProvider>
          </GameProvider>
        </SyncProvider>
      </AuthProvider>
    </PersistQueryClientProvider>
  )
}
