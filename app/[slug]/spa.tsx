"use client"

import { ReactQueryDevtools } from "@tanstack/react-query-devtools"

import App from "@/App"
import { AppProviders } from "@/components/app-providers"
import { RealtimeWatcher } from "@/components/realtime-watcher"
import { SwRegistration } from "@/components/sw-registration"

export default function SPA() {
  return (
    <>
      <AppProviders>
        <App />
      </AppProviders>
      <RealtimeWatcher />
      <ReactQueryDevtools initialIsOpen={false} />
      <SwRegistration />
    </>
  )
}
