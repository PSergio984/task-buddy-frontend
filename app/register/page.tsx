import { NoSSR } from "@/components/no-ssr"
import { PublicRegister } from "@/components/public-pages"
import { publicPageMetadata } from "../public-metadata"

export const metadata = publicPageMetadata(
  "Register | Task Buddy",
  "Create your Task Buddy account."
)

export default function Page() {
  return (
    <NoSSR>
      <PublicRegister />
    </NoSSR>
  )
}
