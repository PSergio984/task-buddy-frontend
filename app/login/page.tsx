import { NoSSR } from "@/components/no-ssr"
import { PublicLogin } from "@/components/public-pages"
import { publicPageMetadata } from "../public-metadata"

export const metadata = publicPageMetadata(
  "Login | Task Buddy",
  "Sign in to your Task Buddy workspace."
)

export default function Page() {
  return (
    <NoSSR>
      <PublicLogin />
    </NoSSR>
  )
}
