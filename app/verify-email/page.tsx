import { NoSSR } from "@/components/no-ssr"
import { PublicVerifyEmail } from "@/components/public-pages"
import { publicPageMetadata } from "../public-metadata"

export const metadata = publicPageMetadata(
  "Verify Email | Task Buddy",
  "Confirm your Task Buddy email address."
)

export default function Page() {
  return (
    <NoSSR>
      <PublicVerifyEmail />
    </NoSSR>
  )
}
