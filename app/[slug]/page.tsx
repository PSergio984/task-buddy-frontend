"use client"

import { NoSSR } from "@/components/no-ssr"
import SPA from "./spa"

export default function CatchAllPage() {
  return (
    <NoSSR>
      <SPA />
    </NoSSR>
  )
}
