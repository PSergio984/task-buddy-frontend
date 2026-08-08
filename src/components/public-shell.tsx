"use client"

import { AppProviders } from "@/components/app-providers"
import { Toaster } from "@/components/ui/toaster"

export function PublicShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <AppProviders>
      {children}
      <Toaster />
    </AppProviders>
  )
}
