"use client"

import { useEffect, useState } from "react"

export function NoSSR({ children }: Readonly<{ children: React.ReactNode }>) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  if (!mounted) return null

  return <>{children}</>
}
