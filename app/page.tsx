import type { Metadata } from "next"

import { NoSSR } from "@/components/no-ssr"
import { PublicLanding } from "@/components/public-pages"
import { publicPageMetadata } from "./public-metadata"

export const metadata: Metadata = publicPageMetadata(
  "Task Buddy — Premium Executive Task Management",
  "Task Buddy: premium executive task management. Organize tasks, projects, and tags with reminders and real-time sync."
)

export default function Page() {
  return (
    <NoSSR>
      <PublicLanding />
    </NoSSR>
  )
}
