import { NoSSR } from "@/components/no-ssr"
import { PublicResetPassword } from "@/components/public-pages"
import { publicPageMetadata } from "../../public-metadata"

export const metadata = publicPageMetadata(
  "Reset Password | Task Buddy",
  "Choose a new password for your Task Buddy account."
)

export default function Page() {
  return (
    <NoSSR>
      <PublicResetPassword />
    </NoSSR>
  )
}
